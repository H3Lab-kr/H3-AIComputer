import SwiftUI
import AppKit

struct InstalledModel: Decodable, Identifiable {
    var id: String { name }
    let name: String
    let size: Int64
    let digest: String
    let modified_at: String
    let details: Details?
    struct Details: Decodable { let family: String?; let parameter_size: String?; let quantization_level: String? }
}
struct PullProgress: Decodable {
    let status: String?
    let total: Int64?
    let completed: Int64?
    let error: String?
    var fraction: Double? {
        guard let total, total > 0, let completed else { return nil }
        return min(1, max(0, Double(completed) / Double(total)))
    }
}
struct OllamaClient {
    let base: URL
    init(_ address: String = "http://127.0.0.1:11434/v1") throws { base = try LocalClient.validate(address).deletingLastPathComponent() }
    static func validateModel(_ model: String) throws {
        guard !model.isEmpty, model.count < 200, model.range(of: "^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$", options: .regularExpression) != nil, !model.contains(".."), !model.contains("://"), !model.hasSuffix(":cloud"), !model.hasSuffix("-cloud") else { throw ClientError.invalidEndpoint }
    }
    private func session() -> URLSession {
        let c = URLSessionConfiguration.ephemeral; c.connectionProxyDictionary = [:]
        c.timeoutIntervalForRequest = 30; c.timeoutIntervalForResource = 86400
        return URLSession(configuration: c, delegate: NoRedirect(), delegateQueue: nil)
    }
    func models() async throws -> [InstalledModel] {
        let s = session(); defer { s.invalidateAndCancel() }
        var request = URLRequest(url: base.appendingPathComponent("api/tags")); request.timeoutInterval = 5
        let (data, response) = try await s.data(for: request)
        guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw ClientError.http((response as? HTTPURLResponse)?.statusCode ?? 0) }
        struct List: Decodable { let models: [InstalledModel] }
        return try JSONDecoder().decode(List.self, from: data).models.sorted { $0.name < $1.name }
    }
    func pull(_ name: String, progress: @escaping @MainActor (PullProgress) -> Void) async throws {
        try Self.validateModel(name)
        let s = session(); defer { s.invalidateAndCancel() }
        var r = URLRequest(url: base.appendingPathComponent("api/pull")); r.httpMethod = "POST"
        r.setValue("application/json", forHTTPHeaderField: "Content-Type")
        r.httpBody = try JSONSerialization.data(withJSONObject: ["model": name, "stream": true])
        let (bytes, response) = try await s.bytes(for: r)
        guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw ClientError.http((response as? HTTPURLResponse)?.statusCode ?? 0) }
        var success = false
        for try await line in bytes.lines {
            try Task.checkCancellation()
            let event = try JSONDecoder().decode(PullProgress.self, from: Data(line.utf8))
            if let error = event.error { throw NSError(domain: "Ollama", code: 1, userInfo: [NSLocalizedDescriptionKey: error]) }
            await progress(event)
            if event.status == "success" { success = true }
        }
        guard success else { throw ClientError.incompleteStream }
    }
}
@MainActor final class ModelLibrary: ObservableObject {
    @Published var installed: [InstalledModel] = []
    @Published var busy = false
    @Published var status = L("Ollama를 실행한 뒤 목록을 새로고침하세요.")
    @Published var fraction: Double?
    @Published var query = ""
    @Published var requestedModel = ""
    @Published var address = "http://127.0.0.1:11434/v1"
    private var job: Task<Void, Never>?
    var filtered: [InstalledModel] { installed.filter { query.isEmpty || $0.name.localizedCaseInsensitiveContains(query) } }
    func refresh() {
        guard !busy else { return }; busy = true
        job = Task {
            defer { busy = false }
            do { installed = try await OllamaClient(address).models(); status = L("설치된 모델 {0}개 · {1} 확인", String(describing: installed.count), String(describing: Date().formatted(date: .omitted, time: .shortened))) }
            catch { status = L("Ollama 연결 확인: ") + error.localizedDescription }
        }
    }
    func pull() {
        guard !busy else { return }
        let name = requestedModel.trimmingCharacters(in: .whitespacesAndNewlines)
        do { try OllamaClient.validateModel(name) } catch { status = L("로컬 모델의 정확한 이름:태그를 입력하세요."); return }
        busy = true; fraction = nil; status = L("{0} 확인 중…", String(describing: name))
        job = Task {
            defer { busy = false }
            do {
                let client = try OllamaClient(address)
                try await client.pull(name) { [weak self] event in
                    self?.status = event.status ?? L("다운로드 중"); self?.fraction = event.fraction
                }
                installed = try await client.models()
                status = L("{0} 다운로드 / 태그 업데이트 완료", String(describing: name)); fraction = nil
            } catch { status = Task.isCancelled ? L("다운로드 연결을 중단했습니다. 목록을 새로고침하여 상태를 확인하세요.") : error.localizedDescription; fraction = nil }
        }
    }
    func stop() { job?.cancel() }
}
struct ModelLibraryView: View {
    @Environment(\.locale) private var locale
    @ObservedObject var library: ModelLibrary
    let useModel: (String, String) -> Void
    @State private var confirmPull = false
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text(L("모델 라이브러리")).font(.largeTitle.bold())
                Text(L("모델을 고르고, 최신 태그를 받고, 바로 대화에 연결하세요.")).foregroundStyle(.secondary)
                HStack {
                    TextField(L("설치 모델 검색"), text: $library.query).textFieldStyle(.roundedBorder)
                    Button(L("목록 새로고침")) { library.refresh() }.disabled(library.busy)
                    Link(L("최신 모델 탐색 ↗"), destination: URL(string: "https://ollama.com/search")!)
                }
                GroupBox(L("다운로드 · 업데이트")) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text(L("Ollama 공식 라이브러리에서 모델 이름:태그를 복사하세요. 같은 태그를 다시 받으면 변경된 버전을 확인합니다.")).font(.callout)
                        HStack {
                            TextField(L("예: qwen3.8:27b"), text: $library.requestedModel).textFieldStyle(.roundedBorder).disabled(library.busy)
                            Button(L("다운로드 / 업데이트")) { confirmPull = true }.disabled(library.busy || library.requestedModel.isEmpty)
                        }
                        Text(L("모델 크기와 라이선스를 공식 페이지에서 확인하세요. 파일 크기보다 실행 메모리가 더 필요합니다. 이 화면은 Ollama 로컬 모델을 관리하며, 음성·이미지·H3 모델은 모델과 연결에서 설정합니다.")).font(.caption).foregroundStyle(.secondary)
                        if let progress = library.fraction { ProgressView(value: progress).accessibilityLabel(L("현재 레이어 다운로드 진행률")) }
                        HStack { Text(library.status).font(.callout).textSelection(.enabled); Spacer(); if library.busy { Button(L("중단")) { library.stop() } } }
                    }.padding(12)
                }
                ForEach(library.filtered) { model in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack { Text(model.name).font(.headline); Spacer(); Button(L("대화에 사용")) { useModel(library.address, model.name) }.disabled(library.busy) }
                        Text([ByteCountFormatter.string(fromByteCount: model.size, countStyle: .file), model.details?.parameter_size ?? "", model.details?.quantization_level ?? ""].filter { !$0.isEmpty }.joined(separator: " · ")).font(.callout).foregroundStyle(.secondary)
                        Text(L("버전 {0} · 변경 {1}", String(describing: model.digest.prefix(16)), String(describing: model.modified_at))).font(.caption).textSelection(.enabled)
                        Button(L("이 태그 업데이트")) { library.requestedModel = model.name; confirmPull = true }.disabled(library.busy)
                    }.padding(18).frame(maxWidth: .infinity, alignment: .leading).background(Color(nsColor: .controlBackgroundColor), in: RoundedRectangle(cornerRadius: 14))
                }
                DisclosureGroup(L("Ollama 설치 및 연결")) {
                    Link(L("Ollama for Mac 설치 ↗"), destination: URL(string: "https://ollama.com/download/mac")!)
                    TextField(L("로컬 Ollama API 주소 (/v1)"), text: $library.address).textFieldStyle(.roundedBorder).disabled(library.busy)
                }
            }.padding(4)
        }.confirmationDialog(L("{0}을 다운로드하거나 업데이트할까요? 저장 공간과 네트워크를 사용하며, 같은 태그의 모델이 갱신될 수 있습니다.", String(describing: library.requestedModel)), isPresented: $confirmPull) {
            Button(L("다운로드 / 업데이트")) { library.pull() }
            Button(L("취소"), role: .cancel) { }
        }
    }
}
