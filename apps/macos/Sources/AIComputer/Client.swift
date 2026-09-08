import Foundation

struct ChatMessage: Codable, Identifiable {
    var id = UUID()
    let role: String
    let content: String
    enum CodingKeys: String, CodingKey { case role, content }
}
struct ModelList: Decodable {
    struct Item: Decodable { let id: String }
    let data: [Item]
}
struct ChatResponse: Decodable {
    struct Choice: Decodable {
        struct Message: Decodable { let content: String? }
        let message: Message
    }
    let choices: [Choice]
}
enum ClientError: LocalizedError {
    case invalidEndpoint, http(Int), emptyReply
    var errorDescription: String? {
        switch self {
        case .invalidEndpoint: return "로컬 주소만 사용할 수 있습니다. 예: http://127.0.0.1:1234/v1"
        case .http(let code): return "로컬 서버 응답 오류 (HTTP \(code)). 서버의 모델·인증 설정을 확인하세요."
        case .emptyReply: return "모델이 응답 내용을 반환하지 않았습니다."
        }
    }
}
// Do not follow a local server redirect to an external endpoint.
final class NoRedirect: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}
struct LocalClient {
    let base: URL
    static func validate(_ value: String) throws -> URL {
        guard let u = URL(string: value), u.scheme == "http", ["127.0.0.1", "[::1]", "::1"].contains(u.host ?? ""), u.user == nil, u.password == nil, u.query == nil, u.fragment == nil, u.path == "/v1" else { throw ClientError.invalidEndpoint }
        return u
    }
    init(_ value: String) throws { base = try Self.validate(value) }
    func request(_ route: String, body: Data? = nil) async throws -> Data {
        let config = URLSessionConfiguration.ephemeral
        config.connectionProxyDictionary = [:]
        config.timeoutIntervalForRequest = 180
        config.timeoutIntervalForResource = 300
        let session = URLSession(configuration: config, delegate: NoRedirect(), delegateQueue: nil)
        defer { session.invalidateAndCancel() }
        var req = URLRequest(url: base.appendingPathComponent(route))
        req.httpMethod = body == nil ? "GET" : "POST"
        req.httpBody = body
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let (data, response) = try await session.data(for: req)
        guard let response = response as? HTTPURLResponse, (200..<300).contains(response.statusCode) else { throw ClientError.http((response as? HTTPURLResponse)?.statusCode ?? 0) }
        return data
    }
    func models() async throws -> [String] {
        try JSONDecoder().decode(ModelList.self, from: await request("models")).data.map(\.id).sorted()
    }
    func chat(model: String, messages: [ChatMessage]) async throws -> String {
        struct Body: Encodable { let model: String; let messages: [ChatMessage]; let stream = false }
        let body = try JSONEncoder().encode(Body(model: model, messages: messages))
        let response = try JSONDecoder().decode(ChatResponse.self, from: await request("chat/completions", body: body))
        guard let text = response.choices.first?.message.content, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw ClientError.emptyReply }
        return text
    }
}
