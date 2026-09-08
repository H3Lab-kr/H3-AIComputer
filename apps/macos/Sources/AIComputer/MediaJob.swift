import Foundation

enum MediaKind: String, CaseIterable, Codable, Identifiable {
    case speech, image, video
    var id: String { rawValue }
    var title: String { switch self { case .speech: return L("음성 만들기"); case .image: return L("이미지 만들기"); case .video: return L("영상 만들기") } }
    var recommendation: String { switch self {
    case .speech: return "Qwen3-TTS 1.7B CustomVoice · MLX 8bit / mlx_audio.tts.generate"
    case .image: return "FLUX.2 klein 4B · MFLUX / mflux-generate-flux2"
    case .video: return L("MiniMax H3 Turbo8 FL2VA · 8스텝 / h3.c")
    } }
    var extensions: Set<String> { switch self { case .speech: return ["wav"]; case .image: return ["png"]; case .video: return ["mp4"] } }
}
struct MediaInput: Codable {
    var kind: MediaKind
    var executable: String
    var model: String
    var prompt: String
    var reference = ""
    var width = 1024
    var height = 1024
    var steps = 4
    var frames = 107
    var seed = 1
    var voice = "Sohee"
    var language = "Korean"
    func validate() throws {
        func fail(_ message: String) throws { throw NSError(domain: "AIComputer", code: 1, userInfo: [NSLocalizedDescriptionKey: message]) }
        guard executable.hasPrefix("/"), FileManager.default.isExecutableFile(atPath: executable) else { try fail(L("실행 가능한 로컬 CLI 파일을 선택하세요.")); return }
        var directory: ObjCBool = false
        guard model.hasPrefix("/"), FileManager.default.fileExists(atPath: model, isDirectory: &directory), directory.boolValue else { try fail(L("이미 준비된 로컬 모델 폴더를 선택하세요. 모델 ID로 다운로드하지 않습니다.")); return }
        guard !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { try fail(L("생성할 내용을 입력하세요.")); return }
        guard steps > 0, steps <= 100, width >= 64, height >= 64, width <= 2048, height <= 2048, width % 32 == 0, height % 32 == 0, frames > 0, frames <= 401, seed >= 0 else { try fail(L("크기는 64~2048의 32 배수, 스텝은 1~100, 프레임은 1~401, 시드는 0 이상이어야 합니다.")); return }
        if !reference.isEmpty {
            guard kind == .video, reference.hasPrefix("/"), FileManager.default.isReadableFile(atPath: reference) else { try fail(L("읽을 수 있는 시작 이미지 파일을 선택하세요.")); return }
        }
    }
    func arguments(output: URL) -> [String] {
        switch kind {
        case .speech:
            return ["--model", model, "--text", prompt, "--voice", voice, "--lang_code", language, "--output_path", output.path, "--join_audio"]
        case .image:
            return ["--model", model, "--base-model", "flux2-klein-4b", "--quantize", "8", "--prompt", prompt, "--steps", String(steps), "--seed", String(seed), "--width", String(width), "--height", String(height), "--output", output.appendingPathComponent("output.png").path]
        case .video:
            var args = ["-d", model, "-p", prompt, "--layers", "50", "--reuse", "1", "--core-reuse", "1", "--use-reference-rope", "--steps", String(steps), "--seed", String(seed), "--width", String(width), "--height", String(height), "--frames", String(frames), "-o", output.appendingPathComponent("output.mp4").path]
            if !reference.isEmpty { args += ["--first-frame", reference] }
            return args
        }
    }
}
struct MediaRecord: Codable, Identifiable {
    var id: String
    var created: Date
    var input: MediaInput
    var arguments: [String]
    var status: String
    var elapsedSeconds: Double?
    var exitCode: Int32?
    var artifacts: [String] = []
    var qualityApproved = false
    var note = L("실행 기록이며 모델 호환성·품질·성능 검증을 의미하지 않습니다.")
    func save(in directory: URL) throws {
        let encoder = JSONEncoder(); encoder.outputFormatting = [.prettyPrinted, .sortedKeys]; encoder.dateEncodingStrategy = .iso8601
        try encoder.encode(self).write(to: directory.appendingPathComponent("request.json"), options: .atomic)
    }
}
enum MediaFiles {
    static var root: URL { FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("AI Computer/Jobs", isDirectory: true) }
    static func prepare(_ input: MediaInput, root: URL = root) throws -> (MediaRecord, URL) {
        try input.validate()
        let formatter = DateFormatter(); formatter.locale = Locale(identifier: "en_US_POSIX"); formatter.dateFormat = "yyyyMMdd'T'HHmmssSSSZZZ"
        let date = Date(), id = "\(formatter.string(from: date))__\(input.kind.rawValue)__\(UUID().uuidString.prefix(8))"
        let directory = root.appendingPathComponent(id, isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let record = MediaRecord(id: id, created: date, input: input, arguments: input.arguments(output: directory), status: "prepared")
        try record.save(in: directory)
        return (record, directory)
    }
    static func artifacts(in directory: URL, kind: MediaKind) throws -> [String] {
        try FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: [.fileSizeKey, .isRegularFileKey]).filter {
            let values = try $0.resourceValues(forKeys: [.fileSizeKey, .isRegularFileKey])
            return kind.extensions.contains($0.pathExtension.lowercased()) && values.isRegularFile == true && (values.fileSize ?? 0) > 0
        }.map(\.lastPathComponent).sorted()
    }
    /// Called at workspace launch only, never during a live job/history refresh.
    static func recoverInterrupted(root: URL = root) throws {
        guard FileManager.default.fileExists(atPath: root.path) else { return }
        let decoder = JSONDecoder(); decoder.dateDecodingStrategy = .iso8601
        for directory in try FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: nil) {
            let file = directory.appendingPathComponent("request.json")
            guard let data = try? Data(contentsOf: file), var record = try? decoder.decode(MediaRecord.self, from: data), record.status == "running" else { continue }
            record.status = "interrupted"
            record.note = L("앱 재시작 시 완료 기록이 없는 작업입니다. 결과와 로그를 확인한 뒤 새 작업으로 다시 시도하세요.")
            try record.save(in: directory)
        }
    }
    static func history() -> [(MediaRecord, URL)] {
        let decoder = JSONDecoder(); decoder.dateDecodingStrategy = .iso8601
        return ((try? FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: nil)) ?? []).compactMap { dir in
            guard let data = try? Data(contentsOf: dir.appendingPathComponent("request.json")), let record = try? decoder.decode(MediaRecord.self, from: data) else { return nil }
            return (record, dir)
        }.sorted { $0.0.created > $1.0.created }
    }
    static func environment(executable: String) -> [String: String] {
        // Explicit allowlist: do not inherit keys, old H3 tuning flags or Python injection settings.
        var env: [String: String] = [:]
        for key in ["HOME", "USER", "TMPDIR", "LANG"] { env[key] = ProcessInfo.processInfo.environment[key] }
        env["PATH"] = URL(fileURLWithPath: executable).deletingLastPathComponent().path + ":/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
        env["HF_HUB_OFFLINE"] = "1"; env["TRANSFORMERS_OFFLINE"] = "1"; env["HF_HUB_DISABLE_TELEMETRY"] = "1"
        return env
    }
}

extension MediaRecord {
    var displayStatus: String {
        switch status {
        case "prepared": return L("설정 확인 대기")
        case "running": return L("실행 중 / 기록 확인")
        case "generated_unreviewed": return L("생성 완료 · 검토 전")
        case "interrupted": return L("중단된 작업 · 확인 후 재시도")
        case "cancelled": return L("중단됨")
        case "failed": return L("실행 실패")
        default: return status
        }
    }
}
