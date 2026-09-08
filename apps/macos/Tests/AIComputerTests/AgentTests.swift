import Foundation
import AppKit
@MainActor final class BrokerComputerFixture: ComputerBackend {
    var available = true
    var reads = 0
    func invalidate() {}
    func observe() throws -> [ComputerElement] { reads += 1; return [] }
    func perform(_ action: String, id: String, text: String) throws { fatalError("Unexpected mutation") }
}
@main struct AgentTests {
    @MainActor static func verifyComputerBroker(endpoint: String, root: URL) async throws {
        for decision in ["deny", "approve", "stop"] {
            let backend = BrokerComputerFixture()
            let agent = AgentWorkspace()
            agent.endpoint = endpoint; agent.model = "computer-fixture"; agent.folder = root.path; agent.prompt = "Observe the test app"
            agent.computerEnabled = true; agent.computerApps = [NSRunningApplication.current]
            agent.computerTarget = NSRunningApplication.current.processIdentifier
            agent.computerBackend = { _ in backend }
            agent.run()
            for _ in 0..<150 {
                if agent.pending != nil { break }
                try await Task.sleep(nanoseconds: 50_000_000)
            }
            precondition(agent.pending?.action == "computer_observe", agent.error)
            precondition(backend.reads == 0, "Read before approval")
            if decision == "stop" { agent.stop() } else { agent.approve(decision == "approve") }
            for _ in 0..<150 { if !agent.busy { break }; try await Task.sleep(nanoseconds: 50_000_000) }
            precondition(!agent.busy)
            precondition(backend.reads == (decision == "approve" ? 1 : 0))
            if let records = agent.recordDirectory { try? FileManager.default.removeItem(at: records) }
        }
        print("PASS: computer broker approves, denies and stops without unapproved observation")
    }
    @MainActor static func main() async throws {
        _ = NSApplication.shared
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }
        let tools = WorkspaceTools(root: root)
        _ = try tools.write("brief.md", content: "한국어 기획안")
        let content = try tools.read("brief.md"); precondition(content == "한국어 기획안")
        for path in ["../outside.md", ".env", "/tmp/private.md", "nested/../private.md", "file.sh", ".git/config.json"] {
            do { _ = try tools.file(path); fatalError("Path accepted: \(path)") } catch { }
        }
        try FileManager.default.createSymbolicLink(at: root.appendingPathComponent("escape.md"), withDestinationURL: URL(fileURLWithPath: "/etc/hosts"))
        do { _ = try tools.read("escape.md"); fatalError("Symlink accepted") } catch { }
        do { _ = try tools.write("brief.md", content: "overwrite"); fatalError("Overwritten") } catch { }
        let preserved = try tools.read("brief.md"); precondition(preserved == content)
        let valid = "{\"action\":\"final\",\"path\":\"\",\"content\":\"\",\"kind\":\"\",\"prompt\":\"\",\"message\":\"완료\"}"
        let action = try AgentAction.decode(valid); precondition(action.message == "완료")
        do { _ = try AgentAction.decode(valid.replacingOccurrences(of: "final", with: "shell")); fatalError("Unknown action accepted") } catch { }
        let progress = try JSONDecoder().decode(PullProgress.self, from: Data("{\"status\":\"pulling\",\"total\":100,\"completed\":25}".utf8))
        precondition(progress.fraction == 0.25)
        for name in ["", "../../etc", "https://evil.test", "x:cloud"] {
            do { try OllamaClient.validateModel(name); fatalError("Invalid model accepted") } catch { }
        }
        try OllamaClient.validateModel("qwen3.8:27b")
        for endpoint in ["http://example.com/v1", "https://user:key@example.com/v1", "https://example.com/v1?key=secret"] {
            do { _ = try CloudMediaClient.validate(endpoint); fatalError("Unsafe API address") } catch { }
        }
        let client = CloudMediaClient(base: try CloudMediaClient.validate("https://example.com/v1"), key: "fixture-only")
        let request = client.request("images/generations", body: Data("{}".utf8))
        precondition(request.url?.absoluteString == "https://example.com/v1/images/generations")
        precondition(request.value(forHTTPHeaderField: "Authorization") == "Bearer fixture-only")
        let payload = CloudMediaClient.payload(kind: .speech, model: "test", prompt: "안녕", size: "", voice: "voice")
        precondition(payload["response_format"] as? String == "wav" && payload["input"] as? String == "안녕")
        let endpoint = ProcessInfo.processInfo.environment["AI_COMPUTER_TEST_ENDPOINT"]
        if let endpoint {
            let agent = AgentWorkspace(); agent.endpoint = endpoint; agent.model = "agent-fixture"; agent.folder = root.path; agent.prompt = "새 문서를 만들어줘"
            var prepared = false
            agent.prepareMedia = { _ in prepared = true; return "prepared only" }
            agent.run()
            for _ in 0..<150 {
                if agent.pending != nil { break }
                if !agent.busy { fatalError(agent.error) }
                try await Task.sleep(nanoseconds: 50_000_000)
            }
            precondition(agent.pending?.action == "write_text")
            precondition(!FileManager.default.fileExists(atPath: root.appendingPathComponent("agent-result.md").path))
            agent.approve(false)
            for _ in 0..<150 { if !agent.busy { break }; try await Task.sleep(nanoseconds: 50_000_000) }
            precondition(!agent.busy && !prepared)
            precondition(!FileManager.default.fileExists(atPath: root.appendingPathComponent("agent-result.md").path))
            precondition(agent.output == "거절을 반영했습니다")
            if let records = agent.recordDirectory { try? FileManager.default.removeItem(at: records) }
            try await verifyComputerBroker(endpoint: endpoint, root: root)

        }
        print("PASS: agent scope, symlinks, no-overwrite, schema, approval denial, model tags, progress and cloud request boundaries")
    }
}
