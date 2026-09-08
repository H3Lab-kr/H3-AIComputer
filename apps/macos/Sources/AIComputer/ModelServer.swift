import SwiftUI
import Foundation

@MainActor final class ModelServer: ObservableObject {
    @Published var running = false
    @Published var error = ""
    @Published var logDirectory: URL?
    private var process: Process?
    let endpoint = "http://127.0.0.1:1235/v1"
    func start(executable: String, model: String) {
        guard !running else { return }
        error = ""
        Task {
            var output: FileHandle?
            defer { try? output?.close(); running = false; process = nil }
            do {
                // Reuse local executable/model validation; no repository ID downloads.
                try MediaInput(kind: .speech, executable: executable, model: model, prompt: "server").validate()
                let dir = MediaFiles.root.deletingLastPathComponent().appendingPathComponent("Servers/\(UUID().uuidString)")
                try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true); logDirectory = dir
                let file = dir.appendingPathComponent("server.log"); FileManager.default.createFile(atPath: file.path, contents: nil)
                output = try FileHandle(forWritingTo: file)
                let p = Process(); p.executableURL = URL(fileURLWithPath: executable)
                p.arguments = ["--host", "127.0.0.1", "--port", "1235", "--model", model, "--max-tokens", "2048", "--max-num-seqs", "1"]
                p.environment = MediaFiles.environment(executable: executable)
                p.standardOutput = output; p.standardError = output; p.standardInput = FileHandle.nullDevice
                process = p; try p.run(); running = true
                while p.isRunning { try await Task.sleep(nanoseconds: 200_000_000) }
                if p.terminationStatus != 0 && p.terminationReason == .exit { error = "서버가 종료되었습니다 (\(p.terminationStatus)). 로그를 확인하세요." }
            } catch { self.error = error.localizedDescription }
        }
    }
    func stop() {
        guard let p = process, p.isRunning else { return }
        p.terminate()
        Task { try? await Task.sleep(nanoseconds: 3_000_000_000); if process === p && p.isRunning { kill(p.processIdentifier, SIGKILL) } }
    }
}
