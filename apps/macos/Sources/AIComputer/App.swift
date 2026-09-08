import SwiftUI
import AppKit

@MainActor final class Workspace: ObservableObject {
    @Published var endpoint = "http://127.0.0.1:1234/v1"
    @Published var connectedEndpoint = ""
    @Published var models: [String] = []
    @Published var selected = ""
    @Published var messages: [ChatMessage] = []
    @Published var draft = ""
    @Published var busy = false
    @Published var discovering = false
    @Published var discovered: [String] = []
    @Published var error = ""
    @Published var streamText = ""
    @Published var partialReply = ""
    @Published var firstTokenSeconds: Double?
    var job: Task<Void, Never>?
    private var savedModel = ""
    private var pendingSave: Task<Void, Never>?
    func scheduleSave() {
        pendingSave?.cancel()
        pendingSave = Task { try? await Task.sleep(nanoseconds: 350_000_000); guard !Task.isCancelled, !busy else { return }; persist() }
    }
    func preferredModel(_ model: String) { savedModel = model }
    var ready: Bool { !selected.isEmpty && connectedEndpoint == endpoint }
    init() {
        do { if let saved = try ConversationStore.load() { endpoint = saved.endpoint; savedModel = saved.model; messages = saved.messages; draft = saved.draft } }
        catch { self.error = "저장한 대화를 읽지 못했습니다. 원본 파일은 보존됩니다. " + error.localizedDescription }
    }
    func persist() {
        pendingSave?.cancel()
        do { try ConversationStore.save(.init(endpoint: endpoint, model: selected.isEmpty ? savedModel : selected, messages: messages, draft: draft)) }
        catch { self.error = "대화 저장 실패: " + error.localizedDescription }
    }
    func clear() { messages = []; draft = ""; partialReply = ""; persist() }
    func discover() {
        guard !discovering else { return }
        discovering = true; discovered = []
        Task {
            defer { discovering = false }
            for port in [1234, 11434, 1235] {
                let address = "http://127.0.0.1:\(port)/v1"
                if let result = try? await LocalClient(address).models(timeout: 2), !result.isEmpty { discovered.append(address) }
            }
        }
    }
    func connect() {
        guard !busy else { return }
        busy = true; error = ""; models = []; selected = ""
        let address = endpoint
        job = Task {
            defer { busy = false }
            do {
                let result = try await LocalClient(address).models()
                try Task.checkCancellation()
                models = result; selected = result.contains(savedModel) ? savedModel : (result.first ?? ""); connectedEndpoint = address
                if result.isEmpty { error = "서버에 모델이 없습니다. 실행 도구에서 로컬 모델을 준비한 뒤 다시 연결하세요." }
                persist()
            } catch { if !Task.isCancelled { self.error = "연결하지 못했습니다. 로컬 서버가 실행 중인지 확인하세요.\n" + error.localizedDescription } }
        }
    }
    func send() {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard ready && !busy && !text.isEmpty else { return }
        let history = messages + [ChatMessage(role: "user", content: text)]
        draft = ""; busy = true; error = ""; streamText = ""; partialReply = ""; firstTokenSeconds = nil
        let address = connectedEndpoint, model = selected, start = Date()
        // Persist the unsent draft until the full exchange has completed.
        do { try ConversationStore.save(.init(endpoint: address, model: model, messages: messages, draft: text)) } catch { self.error = error.localizedDescription }
        job = Task {
            defer { busy = false; streamText = ""; persist() }
            do {
                try await LocalClient(address).stream(model: model, messages: history) { [weak self] chunk in
                    guard let self else { return }
                    if firstTokenSeconds == nil { firstTokenSeconds = Date().timeIntervalSince(start) }
                    streamText += chunk
                }
                try Task.checkCancellation()
                messages = history + [ChatMessage(role: "assistant", content: streamText)]
            } catch {
                partialReply = streamText; draft = text
                self.error = Task.isCancelled ? "응답을 중단했습니다. 입력은 복원했으며 부분 응답은 아래에 표시됩니다." : error.localizedDescription
            }
        }
    }
    func stop() { job?.cancel() }
}
@main struct H3App: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var delegate
    var body: some Scene {
        Window("H3 · AI 컴퓨터", id: "main") { ContentView().frame(minWidth: 1000, minHeight: 700) }
            .defaultSize(width: 1220, height: 860).windowStyle(.titleBar)
    }
}
final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) { NSApp.setActivationPolicy(.regular); NSApp.activate(ignoringOtherApps: true) }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}
enum H3Style {
    static let accent = Color(red: 0.18, green: 0.43, blue: 0.88)
    static let ink = Color(red: 0.035, green: 0.065, blue: 0.13)
    static let card = Color(nsColor: .controlBackgroundColor)
}
struct ContentView: View {
    @StateObject var vm = Workspace()
    @StateObject var media = MediaWorkspace()
    @StateObject var server = ModelServer()
    @StateObject var agent = AgentWorkspace()
    @StateObject var modelLibrary = ModelLibrary()
    @StateObject var cloudMedia = CloudMediaWorkspace()
    @State private var mediaLocation = "local"
    @StateObject var speechDraft = MediaDraft(kind: .speech)
    @StateObject var imageDraft = MediaDraft(kind: .image)
    @StateObject var videoDraft = MediaDraft(kind: .video)
    @AppStorage("llm.executable") var llmExecutable = ""
    @AppStorage("llm.model") var llmModel = ""
    @State private var section = 0
    @State private var confirmClear = false
    private let titles = ["홈", "대화", "음성", "이미지", "영상", "작업 보관함", "모델과 연결", "AI 에이전트", "모델 라이브러리"]
    private let icons = ["square.grid.2x2", "bubble.left.and.bubble.right", "waveform", "photo", "film", "tray.full", "slider.horizontal.3", "sparkles", "square.stack.3d.up"]
    var body: some View {
        HStack(spacing: 0) {
            sidebar
            VStack(spacing: 0) {
                HStack {
                    Text(titles[section]).font(.callout.weight(.medium)).foregroundStyle(.secondary)
                    Spacer()
                    if media.busy || vm.busy { ProgressView().controlSize(.small); Text(media.busy ? "콘텐츠 생성 중" : "답변 준비 중").font(.caption) }
                    Label(vm.ready ? "대화 연결됨" : "로컬 워크스페이스", systemImage: vm.ready ? "checkmark.circle.fill" : "desktopcomputer").font(.caption).foregroundStyle(H3Style.accent)
                }.padding(.horizontal, 32).padding(.vertical, 17)
                Divider()
                VStack(alignment: .leading, spacing: 18) {
                    switch section {
                    case 0: home
                    case 1: chat
                    case 2, 3, 4:
                        Picker("실행 위치", selection: $mediaLocation) { Text("내 Mac · 설치 모델").tag("local"); Text("온라인 API · 선택").tag("cloud") }.pickerStyle(.segmented).disabled(media.busy || cloudMedia.busy)
                        if mediaLocation == "cloud" {
                            CloudMediaView(vm: cloudMedia, form: section == 2 ? speechDraft : section == 3 ? imageDraft : videoDraft, kind: MediaKind.allCases[section - 2]).id(section).disabled(media.busy || vm.busy || agent.busy)
                        } else {
                        if server.running {
                            HStack { Label("콘텐츠 생성에 메모리를 사용하려면 대화 모델을 잠시 내려주세요.", systemImage: "memorychip"); Spacer(); Button("대화 모델 내려놓기") { server.stop() }.disabled(vm.busy) }.font(.callout).padding(14).background(H3Style.accent.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                        }
                        MediaView(vm: media, form: section == 2 ? speechDraft : section == 3 ? imageDraft : videoDraft, kind: MediaKind.allCases[section - 2]).disabled(vm.busy || server.running || agent.busy || cloudMedia.busy)
                        }
                    case 5: library
                    case 7: AgentView(agent: agent) { kind in section = kind == "speech" ? 2 : kind == "image" ? 3 : 4 }.disabled(media.busy || vm.busy || cloudMedia.busy)
                    case 8: ModelLibraryView(library: modelLibrary) { address, model in
                        vm.endpoint = address; vm.preferredModel(model); vm.connect(); section = 1
                    }.disabled(media.busy || vm.busy || agent.busy)
                    default: settings
                    }
                }.padding(32).frame(maxWidth: .infinity, maxHeight: .infinity)
            }.background(Color(nsColor: .windowBackgroundColor))
        }.tint(H3Style.accent)
        .onReceive(NotificationCenter.default.publisher(for: NSApplication.willTerminateNotification)) { _ in if !vm.busy { vm.persist() }; vm.stop(); media.shutdown(); server.shutdown(); agent.shutdown(); modelLibrary.stop(); cloudMedia.stop() }
        .onAppear {
            agent.prepareMedia = { action in
                guard !media.busy, !server.running, let kind = MediaKind(rawValue: action.kind) else { throw AgentFailure.invalidAction }
                let defaults = UserDefaults.standard
                let input = MediaInput(kind: kind, executable: defaults.string(forKey: "media.\(kind.rawValue).executable") ?? "", model: defaults.string(forKey: "media.\(kind.rawValue).model") ?? "", prompt: action.prompt, width: kind == .image ? 1024 : 384, height: kind == .image ? 1024 : 384, steps: kind == .video ? 8 : 4)
                media.prepare(input)
                if !media.error.isEmpty { throw NSError(domain: "H3", code: 1, userInfo: [NSLocalizedDescriptionKey: media.error]) }
                return "로컬 \(kind.title) 작업 준비 완료. 실제 생성 전 사용자가 생성 화면에서 설정을 확인해야 합니다."
            }
        }
        .onChange(of: vm.draft) { _, _ in if !vm.busy { vm.scheduleSave() } }
        .onChange(of: server.running) { old, running in
            if old && !running && vm.connectedEndpoint == server.endpoint { vm.connectedEndpoint = ""; vm.selected = "" }
        }
    }
    var sidebar: some View {
        VStack(alignment: .leading, spacing: 28) {
            VStack(alignment: .leading, spacing: 4) {
                Text("H3").font(.system(size: 48, weight: .black, design: .rounded)).tracking(-3).foregroundStyle(LinearGradient(colors: [Color(red: 0.98, green: 0.89, blue: 0.64), Color(red: 0.72, green: 0.53, blue: 0.23)], startPoint: .topLeading, endPoint: .bottomTrailing))
                Text("AI 컴퓨터").font(.callout.weight(.medium)).foregroundStyle(.white.opacity(0.65))
            }.padding(.horizontal, 14).padding(.top, 14)
            VStack(alignment: .leading, spacing: 7) {
                Text("WORKSPACE").font(.system(size: 10, weight: .semibold)).tracking(2).foregroundStyle(.white.opacity(0.4)).padding(.horizontal, 14).padding(.bottom, 6)
                ForEach(0..<9) { index in
                    if index == 5 { Divider().overlay(.white.opacity(0.08)).padding(.vertical, 12) }
                    Button { section = index } label: {
                        HStack(spacing: 13) {
                            Image(systemName: icons[index]).font(.system(size: 17)).frame(width: 23)
                            Text(titles[index]).font(.system(size: 14, weight: section == index ? .semibold : .regular))
                            Spacer()
                            if section == index { Circle().fill(Color(red: 0.84, green: 0.70, blue: 0.39)).frame(width: 5, height: 5) }
                        }.padding(.horizontal, 14).padding(.vertical, 12)
                            .background(section == index ? Color.white.opacity(0.10) : .clear, in: RoundedRectangle(cornerRadius: 11))
                            .contentShape(Rectangle())
                    }.buttonStyle(.plain).foregroundStyle(.white.opacity(section == index ? 1 : 0.62))
                        .keyboardShortcut(KeyEquivalent(Character(String(index + 1))), modifiers: .command)
                        .accessibilityLabel(titles[index]).accessibilityAddTraits(section == index ? .isSelected : [])
                }
            }
            Spacer()
            VStack(alignment: .leading, spacing: 10) {
                Label("내 Mac에서 실행", systemImage: "desktopcomputer").font(.caption.weight(.medium))
                Text("당신의 일에 집중하는 AI.").font(.caption).foregroundStyle(.white.opacity(0.5))
                Text("PREVIEW 0.4 · APPLE SILICON").font(.system(size: 9, design: .monospaced)).foregroundStyle(.white.opacity(0.35))
            }.padding(14)
        }.padding(18).frame(width: 234).background(H3Style.ink).foregroundStyle(.white)
    }
    var home: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                VStack(alignment: .leading, spacing: 14) {
                    Text("YOUR PERSONAL AI WORKSPACE").font(.system(size: 10, weight: .semibold)).tracking(2).foregroundStyle(H3Style.accent)
                    Text("생각을 정리하고,\n만들고 싶은 것을 만드세요.").font(.system(size: 36, weight: .bold)).tracking(-1.3)
                    Text("대화에서 목소리, 이미지, 영상까지. H3가 내 Mac의 AI를 하나의 작업 공간으로 연결합니다.").foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                }.padding(.vertical, 10)
                GroupBox("시작 준비 · 3단계") {
                    VStack(alignment: .leading, spacing: 12) {
                        Label("1. Mac 확인 · \(ProcessInfo.processInfo.physicalMemory / 1_073_741_824) GB 통합 메모리", systemImage: "checkmark.circle.fill")
                        Label(vm.ready ? "2. 대화 모델 연결 완료" : "2. 설치된 모델 또는 로컬 서버 연결", systemImage: vm.ready ? "checkmark.circle.fill" : "circle")
                        Label(media.history.isEmpty ? "3. 첫 콘텐츠를 만들고 보관함에서 확인" : "3. 작업 보관함 준비 완료", systemImage: media.history.isEmpty ? "circle" : "checkmark.circle.fill")
                        Button(vm.ready ? "대화 이어가기" : "모델 연결 시작") { section = vm.ready ? 1 : 6 }.buttonStyle(.borderedProminent)
                    }.padding(12).frame(maxWidth: .infinity, alignment: .leading)
                }
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                    feature(7, "AI에게 작업 맡기기", "내 자료를 읽고, 기획하고, 로컬 생성 도구를 준비하는 에이전트.", "에이전트 시작")
                    feature(8, "내 모델 라이브러리", "설치 모델을 고르고, 최신 태그를 다운로드하고, 바로 연결하세요.", "모델 둘러보기")
                    feature(1, "함께 생각하는 대화", "아이디어를 정리하고, 문서를 다듬고, 다음 할 일을 찾아보세요.", "대화 시작")
                    feature(2, "문장을 목소리로", "안내 멘트와 내레이션을 만들고, 바로 들어보세요.", "음성 만들기")
                    feature(3, "아이디어를 이미지로", "제품 사진부터 새로운 장면까지, 원하는 모습을 구체화하세요.", "이미지 만들기")
                    feature(4, "장면에 움직임을", "첫 이미지와 장면 설명으로 소리 있는 영상을 만들어보세요.", "영상 만들기")
                }
                HStack(spacing: 20) {
                    Label("\(ProcessInfo.processInfo.physicalMemory / 1_073_741_824) GB 메모리", systemImage: "memorychip")
                    Label("macOS \(ProcessInfo.processInfo.operatingSystemVersion.majorVersion)", systemImage: "desktopcomputer")
                    Spacer(); Button("모델과 연결 관리") { section = 6 }
                }.font(.caption).foregroundStyle(.secondary).padding(18).background(H3Style.card, in: RoundedRectangle(cornerRadius: 14))
                if !media.history.isEmpty {
                    HStack { Text("최근 작업").font(.headline); Spacer(); Button("전체 보기") { section = 5 } }
                    ForEach(Array(media.history.prefix(3)), id: \.0.id) { r, d in historyRow(r, d) }
                }
                Text("모델을 연결하고 첫 결과를 만들어보세요. 대화와 생성 기록은 이 Mac에 보관됩니다.").font(.caption).foregroundStyle(.secondary)
            }
        }
    }
    func feature(_ index: Int, _ title: String, _ description: String, _ action: String) -> some View {
        Button { section = index } label: {
            VStack(alignment: .leading, spacing: 16) {
                Image(systemName: icons[index]).font(.system(size: 23)).foregroundStyle(H3Style.accent).frame(width: 46, height: 46).background(H3Style.accent.opacity(0.08), in: RoundedRectangle(cornerRadius: 13))
                Text(title).font(.title3.bold())
                Text(description).font(.callout).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                HStack { Text(action).font(.callout.weight(.medium)); Spacer(); Image(systemName: "arrow.up.right") }.foregroundStyle(H3Style.accent)
            }.frame(maxWidth: .infinity, minHeight: 170, alignment: .leading).padding(24).background(H3Style.card, in: RoundedRectangle(cornerRadius: 18))
                .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.primary.opacity(0.06)))
        }.buttonStyle(.plain)
    }
    var settings: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Text("내 AI를 연결하세요").font(.largeTitle.bold())
                Text("직접 실행하거나, 이미 사용하는 로컬 AI 서버에 연결할 수 있습니다.").foregroundStyle(.secondary)
                GroupBox("H3에서 대화 모델 실행") {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("설치된 mlx_vlm.server와 로컬 모델 폴더를 선택하세요.").font(.callout).foregroundStyle(.secondary)
                        localPath("실행 파일", $llmExecutable, folder: false)
                        localPath("모델 폴더", $llmModel, folder: true)
                        HStack {
                            if server.running {
                                Button("모델 내려놓기") { server.stop() }.disabled(vm.busy)
                                Button("대화 연결") { vm.endpoint = server.endpoint; vm.connect() }.buttonStyle(.borderedProminent).disabled(vm.busy || !server.ready)
                            } else { Button("모델 실행") { server.start(executable: llmExecutable, model: llmModel) }.buttonStyle(.borderedProminent).disabled(media.busy || llmExecutable.isEmpty || llmModel.isEmpty) }
                            if let dir = server.logDirectory { Button("로그 열기") { NSWorkspace.shared.open(dir) } }
                        }
                        Text(server.running ? (server.ready ? "모델 준비 완료 · 대화에 연결할 수 있습니다." : "모델을 준비하고 있습니다. 연결 가능 여부를 자동 확인합니다.") : "모델은 사용자가 준비한 로컬 폴더에서 불러옵니다.").font(.caption).foregroundStyle(.secondary)
                        if !server.error.isEmpty { Text(server.error).foregroundStyle(.red) }
                    }.padding(12).frame(maxWidth: .infinity, alignment: .leading)
                }
                GroupBox("실행 중인 서버 찾기") {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("LM Studio · Ollama · H3 서버의 로컬 연결을 확인합니다.").foregroundStyle(.secondary)
                        Button(vm.discovering ? "검색 중…" : "내 Mac에서 찾기") { vm.discover() }.disabled(vm.discovering || vm.busy)
                        ForEach(vm.discovered, id: \.self) { address in
                            HStack { Label(address, systemImage: "checkmark.circle.fill"); Spacer(); Button("연결") { vm.endpoint = address; vm.connect() }.disabled(vm.busy) }
                        }
                        if !vm.discovering && vm.discovered.isEmpty { Text("모델이 준비된 서버를 실행한 뒤 찾기를 눌러주세요.").font(.caption).foregroundStyle(.secondary) }
                    }.padding(12).frame(maxWidth: .infinity, alignment: .leading)
                }
                GroupBox("기존 로컬 서버 연결") {
                    VStack(alignment: .leading, spacing: 14) {
                        HStack { Button("LM Studio") { vm.endpoint = "http://127.0.0.1:1234/v1" }; Button("Ollama") { vm.endpoint = "http://127.0.0.1:11434/v1" } }.disabled(vm.busy)
                        HStack { TextField("로컬 서버 주소", text: $vm.endpoint).textFieldStyle(.roundedBorder).disabled(vm.busy); Button("연결 확인") { vm.connect() }.disabled(vm.busy) }
                        if vm.ready { Label("\(vm.models.count)개 모델 연결됨", systemImage: "checkmark.circle.fill").foregroundStyle(H3Style.accent); Button("대화로 이동") { section = 1 } }
                        DisclosureGroup("실행 도구 및 연결 범위") {
                            HStack { Link("LM Studio ↗", destination: URL(string: "https://lmstudio.ai/")!); Link("Ollama ↗", destination: URL(string: "https://ollama.com/download/mac")!) }
                            Text("앱은 루프백 주소에만 연결합니다. 외부 서버의 클라우드 연동 여부는 해당 도구의 설정에서 확인하세요.").font(.caption).foregroundStyle(.secondary)
                        }
                    }.padding(12).frame(maxWidth: .infinity, alignment: .leading)
                }
                status
                GroupBox("데이터와 작업 기록") {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("대화와 입력 초안은 이 Mac에 자동 저장됩니다. 새 대화를 시작하면 기존 대화를 비웁니다. 생성 작업의 입력·설정·로그·결과도 Mac에 보관됩니다.")
                        Button("로컬 작업 폴더 열기") { try? FileManager.default.createDirectory(at: MediaFiles.root, withIntermediateDirectories: true); NSWorkspace.shared.open(MediaFiles.root) }
                    }.font(.callout).padding(12).frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }
    func localPath(_ title: String, _ binding: Binding<String>, folder: Bool) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title).font(.caption).foregroundStyle(.secondary)
            HStack { TextField(title, text: binding).textFieldStyle(.roundedBorder); Button("찾아보기") { let panel = NSOpenPanel(); panel.canChooseDirectories = folder; panel.canChooseFiles = !folder; panel.allowsMultipleSelection = false; if panel.runModal() == .OK, let url = panel.url { binding.wrappedValue = url.path } } }
        }.disabled(server.running)
    }
    var status: some View {
        VStack(alignment: .leading, spacing: 8) {
            if vm.busy { HStack { ProgressView().controlSize(.small); Text("답변 준비 중…"); Button("중단") { vm.stop() } } }
            if !vm.error.isEmpty { Text(vm.error).font(.callout).foregroundStyle(.red).textSelection(.enabled) }
        }
    }
    var chat: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack { Text("함께 생각해볼까요?").font(.largeTitle.bold()); Spacer(); Button("새 대화", systemImage: "square.and.pencil") { confirmClear = true }.disabled(vm.busy || (vm.messages.isEmpty && vm.draft.isEmpty && vm.partialReply.isEmpty)) }
            if media.busy || agent.busy || cloudMedia.busy { Label("콘텐츠 생성이 끝나면 대화를 이어갈 수 있습니다.", systemImage: "hourglass").foregroundStyle(.secondary) }
            if !vm.ready {
                Label("모델을 연결하면 저장된 대화를 이어갈 수 있습니다.", systemImage: "bubble.left.and.bubble.right").foregroundStyle(.secondary)
                Button("모델 연결하기") { section = 6 }.buttonStyle(.borderedProminent)
            }
            Group {
                if vm.ready { Picker("대화 모델", selection: $vm.selected) { ForEach(vm.models, id: \.self) { Text($0).tag($0) } }.disabled(vm.busy) }
                ScrollViewReader { reader in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 18) {
                            if vm.messages.isEmpty {
                                VStack(alignment: .leading, spacing: 14) {
                                    Text("어떤 일부터 시작할까요?").font(.title2.bold())
                                    ForEach(["오늘 할 일을 우선순위에 따라 정리해줘", "새로운 서비스 아이디어를 함께 구체화해줘", "다음 문장을 더 명확하고 자연스럽게 다듬어줘"], id: \.self) { suggestion in
                                        Button { vm.draft = suggestion } label: { HStack { Text(suggestion); Spacer(); Image(systemName: "arrow.up.left") }.padding(14).background(H3Style.card, in: RoundedRectangle(cornerRadius: 12)) }.buttonStyle(.plain)
                                    }
                                }.padding(.vertical, 28)
                            }
                            ForEach(vm.messages) { m in
                                VStack(alignment: .leading, spacing: 10) {
                                    HStack { Text(m.role == "user" ? "나" : "H3").font(.caption.bold()).foregroundStyle(H3Style.accent); Spacer(); Button { NSPasteboard.general.clearContents(); NSPasteboard.general.setString(m.content, forType: .string) } label: { Image(systemName: "doc.on.doc") }.buttonStyle(.plain).help("내용 복사") }
                                    Text(m.content).textSelection(.enabled).frame(maxWidth: .infinity, alignment: .leading)
                                }.padding(20).background(m.role == "user" ? H3Style.accent.opacity(0.06) : H3Style.card, in: RoundedRectangle(cornerRadius: 15)).id(m.id)
                            }
                        }
                    }.onChange(of: vm.messages.count) { _, _ in if let id = vm.messages.last?.id { reader.scrollTo(id, anchor: .bottom) } }
                }
                status
                VStack(spacing: 8) {
                    if !vm.streamText.isEmpty || !vm.partialReply.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(vm.busy ? "H3 · 응답 중" : "중단된 부분 응답").font(.caption.bold()).foregroundStyle(H3Style.accent)
                            ScrollView { Text(vm.busy ? vm.streamText : vm.partialReply).textSelection(.enabled).frame(maxWidth: .infinity, alignment: .leading) }.frame(maxHeight: 150)
                        }.padding(12)
                    }
                    if let first = vm.firstTokenSeconds { Text(String(format: "첫 응답 %.2f초 · 연결 및 서버 대기 포함", first)).font(.caption).foregroundStyle(.secondary) }
                    TextEditor(text: $vm.draft).font(.body).scrollContentBackground(.hidden).frame(height: 85).padding(8).disabled(vm.busy || media.busy)
                    HStack { Text("⌘ Return으로 보내기 · 답변은 확인이 필요합니다.").font(.caption).foregroundStyle(.secondary); Spacer(); Button("보내기", systemImage: "arrow.up") { vm.send() }.buttonStyle(.borderedProminent).keyboardShortcut(.return, modifiers: .command).disabled(!vm.ready || vm.busy || media.busy || agent.busy || cloudMedia.busy || vm.draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) }.padding(.horizontal, 12).padding(.bottom, 12)
                }.background(H3Style.card, in: RoundedRectangle(cornerRadius: 15)).overlay(RoundedRectangle(cornerRadius: 15).stroke(Color.primary.opacity(0.10)))
            }
        }.confirmationDialog("현재 대화를 지우고 새로 시작할까요?", isPresented: $confirmClear) { Button("새 대화 시작", role: .destructive) { vm.clear() }; Button("취소", role: .cancel) {} }
    }
    var library: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack { Text("만든 것들을 한곳에").font(.largeTitle.bold()); Spacer(); Button("새로고침", systemImage: "arrow.clockwise") { media.history = MediaFiles.history() } }
            Text("최신 작업부터 확인하고, 원본 결과와 실행 기록을 다시 열어보세요.").foregroundStyle(.secondary)
            if media.history.isEmpty { ContentUnavailableView("아직 저장된 작업이 없습니다", systemImage: "tray", description: Text("음성·이미지·영상을 만들면 이곳에 기록됩니다.")) }
            else { ScrollView { LazyVStack(spacing: 12) { ForEach(media.history, id: \.0.id) { r, d in historyRow(r, d) } } } }
        }
    }
    func historyRow(_ r: MediaRecord, _ d: URL) -> some View {
        HStack(spacing: 16) {
            Image(systemName: r.input.kind == .speech ? "waveform" : r.input.kind == .image ? "photo" : "film").font(.title2).foregroundStyle(H3Style.accent).frame(width: 36)
            VStack(alignment: .leading, spacing: 4) {
                Text(r.input.prompt).font(.callout.weight(.medium)).lineLimit(1)
                Text(r.created, style: .date) + Text(" · ") + Text(r.created, style: .time) + Text(" · " + r.displayStatus)
            }
            Spacer()
            Button("열기") { media.select(r, d); section = r.input.kind == .speech ? 2 : r.input.kind == .image ? 3 : 4 }.disabled(media.busy)
            Button { NSWorkspace.shared.open(d) } label: { Image(systemName: "folder") }.help("Finder에서 보기")
        }.padding(16).background(H3Style.card, in: RoundedRectangle(cornerRadius: 13))
    }
}
