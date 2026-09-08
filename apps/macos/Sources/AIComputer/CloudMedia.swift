import SwiftUI
import Security
import AVKit

/// Keys never enter job records, preferences, CLI arguments or logs.
enum APIKeyStore {
    static func query(_ account: String) -> [String: Any] { [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "kr.h3lab.H3.media", kSecAttrAccount as String: account] }
    static func save(_ value: String, account: String) throws {
        let data = Data(value.utf8), q = query(account)
        let status = SecItemUpdate(q as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if status == errSecItemNotFound {
            var item = q; item[kSecValueData as String] = data; item[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
            guard SecItemAdd(item as CFDictionary, nil) == errSecSuccess else { throw CloudFailure.keychain }
        } else if status != errSecSuccess { throw CloudFailure.keychain }
    }
    static func read(_ account: String) throws -> String {
        var q = query(account); q[kSecReturnData as String] = true; q[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        guard SecItemCopyMatching(q as CFDictionary, &result) == errSecSuccess, let data = result as? Data, let value = String(data: data, encoding: .utf8), !value.isEmpty else { throw CloudFailure.keychain }
        return value
    }
    static func remove(_ account: String) { SecItemDelete(query(account) as CFDictionary) }
}
enum CloudFailure: LocalizedError {
    case endpoint, keychain, response, remote(String)
    var errorDescription: String? {
        switch self {
        case .endpoint: return "인증 정보·쿼리가 없는 HTTPS API 기본 주소를 입력하세요."
        case .keychain: return "Keychain에서 API 키를 읽거나 저장하지 못했습니다. 키를 다시 저장하세요."
        case .response: return "API 응답이 지원 형식과 다릅니다. 제공자의 모델·출력 형식을 확인하세요."
        case .remote(let value): return value
        }
    }
}
struct CloudMediaClient {
    let base: URL
    let key: String
    static func validate(_ text: String) throws -> URL {
        guard let u = URL(string: text), u.scheme == "https", let host = u.host, !host.isEmpty, u.user == nil, u.password == nil, u.query == nil, u.fragment == nil else { throw CloudFailure.endpoint }
        return u
    }
    func request(_ path: String, body: Data? = nil, contentType: String = "application/json") -> URLRequest {
        var r = URLRequest(url: base.appendingPathComponent(path)); r.httpMethod = body == nil ? "GET" : "POST"; r.httpBody = body
        r.setValue("Bearer " + key, forHTTPHeaderField: "Authorization"); r.setValue(contentType, forHTTPHeaderField: "Content-Type")
        return r
    }
    static func payload(kind: MediaKind, model: String, prompt: String, size: String, voice: String) -> [String: Any] {
        if kind == .speech { return ["model": model, "input": prompt, "voice": voice, "response_format": "wav"] }
        return ["model": model, "prompt": prompt, "size": size, "n": 1]
    }
    func generate(kind: MediaKind, model: String, prompt: String, size: String, voice: String, seconds: String, directory: URL, status: @escaping @MainActor (String) -> Void) async throws -> URL {
        let config = URLSessionConfiguration.ephemeral; config.timeoutIntervalForRequest = 300; config.timeoutIntervalForResource = 1200; config.connectionProxyDictionary = [:]
        let session = URLSession(configuration: config, delegate: NoRedirect(), delegateQueue: nil)
        defer { session.invalidateAndCancel() }
        func fetch(_ request: URLRequest) async throws -> Data {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                throw CloudFailure.remote("API 오류 HTTP \((response as? HTTPURLResponse)?.statusCode ?? 0). 인증·잔액·모델 지원을 확인하세요.")
            }
            return data
        }
        let output = directory.appendingPathComponent(kind == .speech ? "output.wav" : kind == .image ? "output.png" : "output.mp4")
        if kind != .video {
            let body = try JSONSerialization.data(withJSONObject: Self.payload(kind: kind, model: model, prompt: prompt, size: size, voice: voice))
            let data = try await fetch(request(kind == .speech ? "audio/speech" : (base.host == "openrouter.ai" ? "images" : "images/generations"), body: body))
            if kind == .speech {
                guard data.count > 12, data.prefix(4) == Data("RIFF".utf8) else { throw CloudFailure.response }
                try data.write(to: output)
            } else {
                let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                guard let item = (json?["data"] as? [[String: Any]])?.first, let b64 = item["b64_json"] as? String, let pixels = Data(base64Encoded: b64), NSImage(data: pixels) != nil else { throw CloudFailure.response }
                try pixels.write(to: output)
            }
        } else {
            let boundary = "H3-" + UUID().uuidString
            var body = Data()
            for (name, value) in ["model": model, "prompt": prompt, "size": size, "seconds": seconds] {
                body.append(Data("--\(boundary)\r\nContent-Disposition: form-data; name=\"\(name)\"\r\n\r\n\(value)\r\n".utf8))
            }
            body.append(Data("--\(boundary)--\r\n".utf8))
            let videoBody = base.host == "openrouter.ai" ? try JSONSerialization.data(withJSONObject: ["model": model, "prompt": prompt, "size": size, "duration": Int(seconds) ?? 4]) : body
            let data = try await fetch(request("videos", body: videoBody, contentType: base.host == "openrouter.ai" ? "application/json" : "multipart/form-data; boundary=\(boundary)"))
            var json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
            guard let id = json["id"] as? String, id.range(of: "^[A-Za-z0-9_-]+$", options: .regularExpression) != nil else { throw CloudFailure.response }
            try Data(id.utf8).write(to: directory.appendingPathComponent("remote-job-id.txt"))
            let deadline = Date().addingTimeInterval(900)
            while json["status"] as? String != "completed" {
                try Task.checkCancellation()
                if json["status"] as? String == "failed" { throw CloudFailure.remote("서비스의 영상 생성 작업이 실패했습니다.") }
                guard Date() < deadline else { throw CloudFailure.remote("영상 작업 대기 시간이 초과되었습니다. 원격 작업 ID를 확인하세요.") }
                await status("영상 생성: \(json["status"] as? String ?? "대기") · \(json["progress"] as? Int ?? 0)%")
                try await Task.sleep(nanoseconds: 3_000_000_000)
                json = try JSONSerialization.jsonObject(with: await fetch(request("videos/\(id)"))) as? [String: Any] ?? [:]
            }
            let video = try await fetch(request("videos/\(id)/content"))
            guard video.count > 12, video.subdata(in: 4..<8) == Data("ftyp".utf8) else { throw CloudFailure.response }
            try video.write(to: output)
        }
        return output
    }
}
@MainActor final class CloudMediaWorkspace: ObservableObject {
    @Published var busy = false
    @Published var status = ""
    @Published var output: URL?
    @Published var directory: URL?
    @Published var player: AVPlayer?
    private var job: Task<Void, Never>?
    func run(kind: MediaKind, endpoint: String, model: String, prompt: String, size: String, voice: String, seconds: String) {
        guard !busy else { return }
        busy = true; status = "온라인 API 요청 중"; output = nil; player = nil
        job = Task {
            defer { busy = false }
            let start = Date()
            var record: MediaRecord?
            do {
                let base = try CloudMediaClient.validate(endpoint), key = try APIKeyStore.read(base.absoluteString)
                let dir = MediaFiles.root.appendingPathComponent("\(ISO8601DateFormatter().string(from: start).replacingOccurrences(of: ":", with: ""))__cloud__\(UUID().uuidString.prefix(8))")
                try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true); directory = dir
                var r = MediaRecord(id: dir.lastPathComponent, created: start, input: MediaInput(kind: kind, executable: "cloud-api", model: model, prompt: prompt), arguments: [base.absoluteString, size, voice, seconds], status: "running")
                try r.save(in: dir); record = r
                let result = try await CloudMediaClient(base: base, key: key).generate(kind: kind, model: model, prompt: prompt, size: size, voice: voice, seconds: seconds, directory: dir) { [weak self] in self?.status = $0 }
                r.status = "generated_unreviewed"; r.artifacts = [result.lastPathComponent]; r.elapsedSeconds = Date().timeIntervalSince(start); try r.save(in: dir)
                output = result; status = "생성 완료 · 검토 전 · \(Int(r.elapsedSeconds!))초"
                if kind != .image { player = AVPlayer(url: result) }
            } catch {
                status = Task.isCancelled ? "대기를 중단했습니다. 원격 서비스의 생성·과금이 중단된 것은 아닙니다. 작업 ID를 확인하세요." : error.localizedDescription
                if var r = record, let directory { r.status = Task.isCancelled ? "cancelled" : "failed"; r.elapsedSeconds = Date().timeIntervalSince(start); try? r.save(in: directory) }
            }
        }
    }
    func stop() { job?.cancel() }
}
struct CloudMediaView: View {
    @ObservedObject var vm: CloudMediaWorkspace
    @ObservedObject var form: MediaDraft
    let kind: MediaKind
    @State private var endpoint = "https://api.openai.com/v1"
    @State private var model = ""
    @State private var key = ""
    @State private var voice = "alloy"
    @State private var size = "1024x1024"
    @State private var seconds = "4"
    @State private var message = ""
    @State private var confirm = false
    private var preferenceKey: String { "cloud.\(kind.rawValue)" }
    private func saveConnection() {
        UserDefaults.standard.set(["endpoint": endpoint, "model": model, "voice": voice, "size": size, "seconds": seconds], forKey: preferenceKey)
    }
    var body: some View {
        ScrollView { VStack(alignment: .leading, spacing: 16) {
            Text("\(kind.title) · 선택형 API").font(.largeTitle.bold())
            Text("요청을 선택한 서비스에 전송합니다. 사용료는 해당 서비스 계정에 적용됩니다. 로컬 모드로 자동 전환하거나 로컬 입력을 자동 업로드하지 않습니다.").font(.callout).foregroundStyle(.secondary)
            GroupBox("OpenRouter · OpenAI 호환 API 연결") {
                VStack(alignment: .leading, spacing: 10) {
                    HStack { Button("OpenRouter") { endpoint = "https://openrouter.ai/api/v1" }; Button("OpenAI") { endpoint = "https://api.openai.com/v1" } }
                    TextField("HTTPS API 기본 주소", text: $endpoint).textFieldStyle(.roundedBorder)
                    TextField("제공자가 지원하는 모델 ID", text: $model).textFieldStyle(.roundedBorder)
                    HStack { SecureField("API 키 (Keychain 저장)", text: $key).textFieldStyle(.roundedBorder); Button("키 저장") {
                        do { let url = try CloudMediaClient.validate(endpoint); guard !key.isEmpty else { return }; try APIKeyStore.save(key, account: url.absoluteString); key = ""; message = "이 API 주소의 키를 Keychain에 저장했습니다." } catch { message = error.localizedDescription }
                    }; Button("저장 키 삭제") { APIKeyStore.remove(endpoint); message = "저장 키 삭제 요청 완료" } }
                    Text(message).font(.caption)
                    Text(kind == .speech ? "규격: /audio/speech · WAV" : kind == .image ? "규격: /images/generations · base64 이미지 응답" : "규격: /videos · 생성 요청 / 상태 조회 / MP4 다운로드").font(.caption).foregroundStyle(.secondary)
                }.padding(10)
            }.disabled(vm.busy)
            TextEditor(text: $form.prompt).frame(minHeight: 110).disabled(vm.busy)
            HStack {
                if kind == .speech { TextField("목소리 ID", text: $voice).textFieldStyle(.roundedBorder) }
                else { TextField("크기 (예: 1024x1024 / 영상 720x1280)", text: $size).textFieldStyle(.roundedBorder) }
                if kind == .video { Picker("초", selection: $seconds) { Text("4초").tag("4"); Text("8초").tag("8"); Text("12초").tag("12") } }
            }.disabled(vm.busy)
            HStack { Button("온라인 API로 생성") { confirm = true }.buttonStyle(.borderedProminent).disabled(vm.busy || model.isEmpty || form.prompt.isEmpty); if vm.busy { ProgressView(); Button("대기 중단") { vm.stop() } } }
            Text(vm.status).textSelection(.enabled)
            if let url = vm.output {
                if url.pathExtension == "png", let image = NSImage(contentsOf: url) { Image(nsImage: image).resizable().scaledToFit().frame(maxHeight: 320) }
                else if let player = vm.player { VideoPlayer(player: player).frame(height: 240) }
                Button("원본 보기") { NSWorkspace.shared.open(url) }
            }
            if let directory = vm.directory { Button("기록 폴더 열기") { NSWorkspace.shared.open(directory) } }
        } }.onAppear {
            let saved = UserDefaults.standard.dictionary(forKey: preferenceKey) as? [String: String] ?? [:]
            endpoint = saved["endpoint"] ?? "https://api.openai.com/v1"; model = saved["model"] ?? ""
            voice = saved["voice"] ?? "alloy"; size = saved["size"] ?? (kind == .video ? "720x1280" : "1024x1024"); seconds = saved["seconds"] ?? "4"
        }.onDisappear { saveConnection() }.confirmationDialog("\(endpoint)에 프롬프트를 보내 \(model)로 생성할까요? 서비스 사용료가 발생할 수 있습니다.", isPresented: $confirm) {
            Button("전송하고 생성") { saveConnection(); vm.run(kind: kind, endpoint: endpoint, model: model, prompt: form.prompt, size: size, voice: voice, seconds: seconds) }
            Button("취소", role: .cancel) { }
        }
    }
}
