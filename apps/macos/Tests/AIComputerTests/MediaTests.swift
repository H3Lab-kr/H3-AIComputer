import Foundation
@main struct MediaTests {
    static func main() throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }
        let executable = root.appendingPathComponent("fake engine")
        try Data("#!/bin/sh\nexit 0\n".utf8).write(to: executable)
        try FileManager.default.setAttributes([.posixPermissions: 0o700], ofItemAtPath: executable.path)
        var input = MediaInput(kind: .video, executable: executable.path, model: root.path, prompt: "한국어 'quotes' $(touch BAD);", steps: 8)
        let (record, dir) = try MediaFiles.prepare(input, root: root)
        precondition(record.status == "prepared" && record.arguments.contains(input.prompt))
        precondition(record.arguments[record.arguments.firstIndex(of: "--steps")! + 1] == "8")
        precondition(!record.qualityApproved)
        let (_, second) = try MediaFiles.prepare(input, root: root)
        precondition(second != dir)
        try Data().write(to: dir.appendingPathComponent("empty.mp4"))
        try Data([1]).write(to: dir.appendingPathComponent("output.mp4"))
        let artifacts = try MediaFiles.artifacts(in: dir, kind: .video); precondition(artifacts == ["output.mp4"])
        input.model = "organization/remote-model"
        do { try input.validate(); fatalError("Remote model ID allowed") } catch { }
        input.model = root.path; input.width = 385
        do { try input.validate(); fatalError("Invalid dimensions allowed") } catch { }
        let env = MediaFiles.environment(executable: executable.path)
        precondition(env["HF_HUB_OFFLINE"] == "1" && env["H3_DIT_F32_FINAL"] == nil && env["OPENAI_API_KEY"] == nil)
        print("PASS: local paths, literal arguments, 8 steps, unique records, artifact checks, offline environment")
    }
}
