import Foundation

struct ChatMessage: Codable, Identifiable {
    var id = UUID()
    let role: String
    var content: String
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
    case invalidEndpoint, http(Int), emptyReply, incompleteStream
    var errorDescription: String? {
        switch self {
        case .invalidEndpoint: return L("로컬 주소만 사용할 수 있습니다. 예: http://127.0.0.1:1234/v1")
        case .http(let code): return L("로컬 서버 응답 오류 (HTTP {0}). 서버의 모델·인증 설정을 확인하세요.", String(describing: code))
        case .incompleteStream: return L("응답 연결이 완료 전에 끊겼습니다. 부분 응답을 확인하고 다시 요청하세요.")
        case .emptyReply: return L("모델이 응답 내용을 반환하지 않았습니다.")
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
    func request(_ route: String, body: Data? = nil, timeout: TimeInterval = 180) async throws -> Data {
        let config = URLSessionConfiguration.ephemeral
        config.connectionProxyDictionary = [:]
        config.timeoutIntervalForRequest = timeout
        config.timeoutIntervalForResource = max(timeout, 5)
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
    func models(timeout: TimeInterval = 5) async throws -> [String] {
        try JSONDecoder().decode(ModelList.self, from: await request("models", timeout: timeout)).data.map(\.id).sorted()
    }
    func chat(model: String, messages: [ChatMessage]) async throws -> String {
        struct Body: Encodable { let model: String; let messages: [ChatMessage]; let stream = false }
        let body = try JSONEncoder().encode(Body(model: model, messages: messages))
        let response = try JSONDecoder().decode(ChatResponse.self, from: await request("chat/completions", body: body))
        guard let text = response.choices.first?.message.content, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw ClientError.emptyReply }
        return text
    }
}


extension LocalClient {
    /// A dedicated session ensures cancellation closes the owned network stream.
    func stream(model: String, messages: [ChatMessage], onText: @escaping @MainActor (String) -> Void) async throws {
        struct Body: Encodable { let model: String; let messages: [ChatMessage]; let stream = true }
        struct Chunk: Decodable {
            struct Choice: Decodable {
                struct Delta: Decodable { let content: String? }
                let delta: Delta
                let finish_reason: String?
            }
            let choices: [Choice]
        }
        let config = URLSessionConfiguration.ephemeral
        config.connectionProxyDictionary = [:]
        config.timeoutIntervalForRequest = 180
        config.timeoutIntervalForResource = 600
        let session = URLSession(configuration: config, delegate: NoRedirect(), delegateQueue: nil)
        defer { session.invalidateAndCancel() }
        var request = URLRequest(url: base.appendingPathComponent("chat/completions"))
        request.httpMethod = "POST"
        request.httpBody = try JSONEncoder().encode(Body(model: model, messages: messages))
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        let (bytes, response) = try await session.bytes(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw ClientError.http((response as? HTTPURLResponse)?.statusCode ?? 0)
        }
        var received = false, completed = false
        for try await line in bytes.lines {
            try Task.checkCancellation()
            guard line.hasPrefix("data:") else { continue }
            let payload = String(line.dropFirst(5)).trimmingCharacters(in: .whitespaces)
            if payload == "[DONE]" { completed = true; break }
            let chunk = try JSONDecoder().decode(Chunk.self, from: Data(payload.utf8))
            if let choice = chunk.choices.first {
                if let content = choice.delta.content, !content.isEmpty {
                    received = true
                    await onText(content)
                }
                if choice.finish_reason != nil { completed = true }
            }
        }
        try Task.checkCancellation()
        guard completed else { throw ClientError.incompleteStream }
        guard received else { throw ClientError.emptyReply }
    }
}

struct ConversationSnapshot: Codable {
    var endpoint: String
    var model: String
    var messages: [ChatMessage]
    var draft: String
}
enum ConversationStore {
    static var url: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("AI Computer/conversation.json")
    }
    static func load(from url: URL = url) throws -> ConversationSnapshot? {
        guard FileManager.default.fileExists(atPath: url.path) else { return nil }
        return try JSONDecoder().decode(ConversationSnapshot.self, from: Data(contentsOf: url))
    }
    static func save(_ value: ConversationSnapshot, to url: URL = url) throws {
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try JSONEncoder().encode(value).write(to: url, options: .atomic)
        try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: url.path)
    }
}
