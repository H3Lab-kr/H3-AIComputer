import AppKit
@MainActor final class FixtureComputer: ComputerBackend {
    var available = true
    var reads = 0
    var writes = 0
    func invalidate() {}
    func observe() throws -> [ComputerElement] {
        reads += 1
        return [ComputerElement(id: "field", role: "AXTextField", label: "Test", value: "", press: false, edit: true)]
    }
    func perform(_ action: String, id: String, text: String) throws { writes += 1 }
}
@main struct ComputerTests {
    @MainActor static func reject(_ body: () throws -> Void) {
        do { try body(); fatalError("Unsafe action accepted") } catch { }
    }
    @MainActor static func main() throws {
        let backend = FixtureComputer(), session = ComputerSession(backend: FixtureComputer())
        let control = ComputerSession(backend: backend)
        reject { _ = try control.execute("computer_type", id: "field", text: "before observation") }
        _ = try control.execute("computer_observe", id: "", text: "")
        _ = try control.preview("computer_type", id: "field", text: "hello")
        precondition(backend.writes == 0, "Preview mutated app")
        reject { _ = try control.execute("computer_press", id: "field", text: "") }
        reject { _ = try control.execute("computer_type", id: "invented", text: "hello") }
        reject { _ = try control.execute("computer_type", id: "field", text: String(repeating: "x", count: 4097)) }
        _ = try control.execute("computer_type", id: "field", text: "hello")
        precondition(backend.writes == 1)
        reject { _ = try control.execute("computer_type", id: "field", text: "replay") }
        _ = try control.execute("computer_observe", id: "", text: "")
        control.now = { Date().addingTimeInterval(61) }
        reject { _ = try control.execute("computer_type", id: "field", text: "expired") }
        control.now = { Date() }
        _ = try control.execute("computer_observe", id: "", text: "")
        control.invalidate()
        reject { _ = try control.execute("computer_type", id: "field", text: "stopped") }
        backend.available = false
        reject { _ = try control.execute("computer_observe", id: "", text: "") }
        reject { _ = try control.execute("computer_focus", id: "", text: "") }
        precondition(backend.writes == 1)
        _ = session
        print("PASS: computer capabilities, preview without effects, invalid IDs, size, replay, expiry, stop and permission revocation")
        print("Live AX permission: \(MacComputerBackend(application: NSRunningApplication.current).available)")
    }
}
