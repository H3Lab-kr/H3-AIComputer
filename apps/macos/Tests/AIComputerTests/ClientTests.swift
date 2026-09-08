import Foundation
@main struct ClientTests {
    static func main() async throws {
        _ = try LocalClient.validate("http://127.0.0.1:1234/v1")
        for address in ["https://example.com/v1", "http://127.0.0.1.evil.test/v1", "http://192.168.1.1:1234/v1", "http://user:password@127.0.0.1/v1", "http://127.0.0.1/v1?key=value", "http://localhost:1234/v1"] {
            do { _ = try LocalClient.validate(address); fatalError("External endpoint accepted") } catch ClientError.invalidEndpoint { }
        }
        let encoded = try JSONEncoder().encode(ChatMessage(role: "user", content: "안녕하세요"))
        let object = try JSONSerialization.jsonObject(with: encoded) as! [String: String]
        precondition(Set(object.keys) == Set(["role", "content"]))
        let endpoint = ProcessInfo.processInfo.environment["AI_COMPUTER_TEST_ENDPOINT"]!
        let client = try LocalClient(endpoint)
        let models = try await client.models(); precondition(models == ["fixture-model"])
        let answer = try await client.chat(model: "fixture-model", messages: [ChatMessage(role: "user", content: "테스트")])
        precondition(answer == "로컬 연결 테스트 응답")
        print("PASS: loopback validation, message serialization, model listing, chat roundtrip")
    }
}
