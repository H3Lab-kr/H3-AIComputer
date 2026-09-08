import Foundation
@main struct MediaRunnerTests {
    @MainActor static func main() async throws {
        let suite = "H3DraftTests-" + UUID().uuidString
        let defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        let draft = MediaDraft(kind: .video, defaults: defaults)
        precondition(draft.steps == 8)
        draft.prompt = "복원할 장면"; draft.seed = 42; draft.language = "English"
        let restored = MediaDraft(kind: .video, defaults: defaults)
        precondition(restored.prompt == "복원할 장면" && restored.seed == 42 && restored.steps == 8 && restored.language == "English")
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
        try prepare()
        var stale = vm.record!; stale.status = "running"; try stale.save(in: vm.directory!)
        try MediaFiles.recoverInterrupted(root: root)
        let decoder = JSONDecoder(); decoder.dateDecodingStrategy = .iso8601
        let recovered = try decoder.decode(MediaRecord.self, from: Data(contentsOf: vm.directory!.appendingPathComponent("request.json")))
        precondition(recovered.status == "interrupted" && recovered.qualityApproved == false)
        try MediaFiles.recoverInterrupted(root: root)
        print("PASS: interrupted job recovery is idempotent and never approves output")
        print("PASS: runner success, literal prompt, process failure and cancellation")
    }
}
