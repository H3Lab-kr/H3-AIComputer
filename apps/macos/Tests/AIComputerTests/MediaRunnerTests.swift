import Foundation
@main struct MediaRunnerTests {
    @MainActor static func main() async throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }
        let engine = root.appendingPathComponent("fake")
        func script(_ body: String) throws {
            try Data(("#!/bin/sh\n" + body).utf8).write(to: engine)
            try FileManager.default.setAttributes([.posixPermissions: 0o700], ofItemAtPath: engine.path)
        }
        let input = MediaInput(kind: .image, executable: engine.path, model: root.path, prompt: "'; touch SHOULD_NOT_EXIST; '")
        let vm = MediaWorkspace()
        func prepare() throws {
            let (r, d) = try MediaFiles.prepare(input, root: root)
            vm.record = r; vm.directory = d
        }
        func finish() async throws {
            for _ in 0..<100 {
                if !vm.busy { return }
                try await Task.sleep(nanoseconds: 100_000_000)
            }
            fatalError("Runner did not finish")
        }
        try script("for arg in \"$@\"; do last=\"$arg\"; done\nprintf x > \"$last\"\n")
        try prepare(); vm.run(); try await finish()
        precondition(vm.record?.status == "generated_unreviewed")
        precondition(!FileManager.default.fileExists(atPath: root.appendingPathComponent("SHOULD_NOT_EXIST").path))
        try script("echo 'fixture error' >&2\nexit 7\n")
        try prepare(); vm.run(); try await finish()
        precondition(vm.record?.status == "failed" && vm.record?.exitCode == 7)
        try script("exec /bin/sleep 30\n")
        try prepare(); vm.run(); try await Task.sleep(nanoseconds: 200_000_000); vm.stop(); try await finish()
        precondition(vm.record?.status == "cancelled")
        print("PASS: runner success, literal prompt, process failure and cancellation")
    }
}
