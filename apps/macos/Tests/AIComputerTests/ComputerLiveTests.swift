import AppKit
@main struct ComputerLiveTests {
    @MainActor static func main() async throws {
        let pid = Int32(CommandLine.arguments[1])!
        guard let app = NSRunningApplication(processIdentifier: pid) else { fatalError("Fixture not running") }
        let backend = MacComputerBackend(application: app)
        guard backend.available else { print("SKIP: live AX test requires Accessibility permission; policy tests remain mandatory"); return }
        let session = ComputerSession(backend: backend)
        var rows: [ComputerElement] = []
        for _ in 0..<20 {
            do {
                let data = try session.execute("computer_observe", id: "", text: "")
                precondition(!data.contains("H3-SECRET-FIXTURE") && !data.contains("Protected fixture"), "Secure field leaked")
                rows = try JSONDecoder().decode([ComputerElement].self, from: Data(data.utf8))
                if rows.contains(where: { $0.edit }) { break }
            } catch { }
            try await Task.sleep(nanoseconds: 100_000_000)
        }
        guard let field = rows.first(where: { $0.edit }) else { fatalError("No editable fixture field: \(rows)") }
        _ = try session.execute("computer_type", id: field.id, text: "H3 한국어 English verified")
        let next = try session.execute("computer_observe", id: "", text: "")
        rows = try JSONDecoder().decode([ComputerElement].self, from: Data(next.utf8))
        precondition(rows.contains(where: { $0.value == "H3 한국어 English verified" }))
        guard let button = rows.first(where: { $0.press && $0.label.contains("Save fixture") }) else { fatalError("No fixture button") }
        _ = try session.execute("computer_press", id: button.id, text: "")
        for _ in 0..<20 {
            if (try? String(contentsOfFile: CommandLine.arguments[2], encoding: .utf8)) == "H3 한국어 English verified" { print("PASS: real cross-process AX observation, secure-field exclusion, bilingual text replacement, button press and saved result"); return }
            try await Task.sleep(nanoseconds: 100_000_000)
        }
        fatalError("Button did not save expected fixture content")
    }
}
