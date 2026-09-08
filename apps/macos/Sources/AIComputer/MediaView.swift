import SwiftUI
import AppKit
import AVKit

@MainActor final class MediaWorkspace: ObservableObject {
    @Published var busy = false
    @Published var error = ""
    @Published var record: MediaRecord?
    @Published var directory: URL?
    @Published var history = MediaFiles.history()
    @Published var player: AVPlayer?
    @Published var image: NSImage?
    private var process: Process?
    private var cancelled = false
    @Published var startedAt: Date?
    init() {
        do { try MediaFiles.recoverInterrupted(); history = MediaFiles.history() }
        catch { self.error = "이전 작업 확인 실패: " + error.localizedDescription }
    }
    func shutdown() {
        guard let p = process, p.isRunning else { return }
        cancelled = true; p.terminate()
        if p.isRunning { kill(p.processIdentifier, SIGKILL) }
        if var r = record, let d = directory { r.status = "interrupted"; try? r.save(in: d) }
    }
    func retry() { guard !busy, let r = record, r.input.executable != "cloud-api" else { return }; prepare(r.input) }

    func prepare(_ input: MediaInput) {
        guard !busy else { return }
        error = ""; player?.pause(); player = nil; image = nil
        do { let (r, d) = try MediaFiles.prepare(input); record = r; directory = d; history = MediaFiles.history() }
        catch { self.error = error.localizedDescription }
    }
    func run() {
        guard !busy, var r = record, r.status == "prepared", let d = directory else { return }
        busy = true; error = ""; cancelled = false
        Task {
            var handles: [FileHandle] = []
            defer { handles.forEach { try? $0.close() }; process = nil; busy = false; history = MediaFiles.history() }
            let start = Date(); startedAt = start
            do {
                try r.input.validate()
                let p = Process(); p.executableURL = URL(fileURLWithPath: r.input.executable); p.arguments = r.arguments
                p.currentDirectoryURL = URL(fileURLWithPath: r.input.executable).deletingLastPathComponent()
                p.environment = MediaFiles.environment(executable: r.input.executable)
                for name in ["stdout.log", "stderr.log"] {
                    let path = d.appendingPathComponent(name)
                    FileManager.default.createFile(atPath: path.path, contents: nil)
                    handles.append(try FileHandle(forWritingTo: path))
                }
                p.standardOutput = handles[0]; p.standardError = handles[1]; p.standardInput = FileHandle.nullDevice
                process = p; r.status = "running"; try r.save(in: d); record = r
                try p.run()
                while p.isRunning { try await Task.sleep(nanoseconds: 100_000_000) }
                r.elapsedSeconds = Date().timeIntervalSince(start); r.exitCode = p.terminationStatus
                r.artifacts = try MediaFiles.artifacts(in: d, kind: r.input.kind)
                r.status = cancelled ? "cancelled" : (p.terminationStatus == 0 && !r.artifacts.isEmpty ? "generated_unreviewed" : "failed")
                if r.status == "failed" { error = "생성하지 못했습니다. 결과 폴더의 stderr.log를 확인하세요." }
                try r.save(in: d); record = r; preview(r, d)
            } catch {
                r.status = "failed"; r.elapsedSeconds = Date().timeIntervalSince(start); try? r.save(in: d); record = r
                self.error = error.localizedDescription
            }
        }
    }
    func stop() {
        guard let p = process, p.isRunning else { return }
        cancelled = true; p.terminate()
        Task { try? await Task.sleep(nanoseconds: 3_000_000_000); if process === p && p.isRunning { kill(p.processIdentifier, SIGKILL) } }
    }
    func preview(_ r: MediaRecord, _ d: URL) {
        player?.pause(); player = nil; image = nil
        guard r.status == "generated_unreviewed", let name = r.artifacts.first else { return }
        let url = d.appendingPathComponent(name)
        if r.input.kind == .image { image = NSImage(contentsOf: url) } else { player = AVPlayer(url: url) }
    }
    func select(_ r: MediaRecord, _ d: URL) { guard !busy else { return }; record = r; directory = d; preview(r, d) }
}
@MainActor final class MediaDraft: ObservableObject {
    private let key: String
    private let defaults: UserDefaults
    @Published var prompt = "" { didSet { save() } }
    @Published var reference = "" { didSet { save() } }
    @Published var voice = "Sohee" { didSet { save() } }
    @Published var width: Int { didSet { save() } }
    @Published var height: Int { didSet { save() } }
    @Published var frames = 107 { didSet { save() } }
    @Published var steps: Int { didSet { save() } }
    @Published var seed = 1 { didSet { save() } }
    init(kind: MediaKind, defaults: UserDefaults = .standard) {
        self.defaults = defaults; key = "draft.\(kind.rawValue)"
        let saved = defaults.dictionary(forKey: key) ?? [:]
        width = saved["width"] as? Int ?? (kind == .image ? 1024 : 384)
        height = saved["height"] as? Int ?? (kind == .image ? 1024 : 384)
        steps = saved["steps"] as? Int ?? (kind == .video ? 8 : 4)
        prompt = saved["prompt"] as? String ?? ""
        reference = saved["reference"] as? String ?? ""
        voice = saved["voice"] as? String ?? "Sohee"
        frames = saved["frames"] as? Int ?? 107
        seed = saved["seed"] as? Int ?? 1
    }
    private func save() {
        defaults.set(["prompt": prompt, "reference": reference, "voice": voice, "width": width, "height": height, "frames": frames, "steps": steps, "seed": seed], forKey: key)
    }
}
struct MediaView: View {
    @ObservedObject var vm: MediaWorkspace
    @ObservedObject var form: MediaDraft
    let kind: MediaKind
    @AppStorage("media.speech.executable") var speechExecutable = ""
    @AppStorage("media.image.executable") var imageExecutable = ""
    @AppStorage("media.video.executable") var videoExecutable = ""
    @AppStorage("media.speech.model") var speechModel = ""
    @AppStorage("media.image.model") var imageModel = ""
    @AppStorage("media.video.model") var videoModel = ""
    @State private var showConnection = false
    private let accent = Color(red: 0.18, green: 0.43, blue: 0.88)
    var executable: Binding<String> { switch kind { case .speech: return $speechExecutable; case .image: return $imageExecutable; case .video: return $videoExecutable } }
    var model: Binding<String> { switch kind { case .speech: return $speechModel; case .image: return $imageModel; case .video: return $videoModel } }
    var pathsSet: Bool { !executable.wrappedValue.isEmpty && !model.wrappedValue.isEmpty }
    var subtitle: String { switch kind {
        case .speech: return "전하고 싶은 말을 적고, 목소리로 들어보세요."
        case .image: return "주제와 구도, 빛과 분위기를 함께 설명해보세요."
        case .video: return "한 장면의 움직임과 대사, 소리를 구체적으로 적어보세요."
    } }
    func choose(_ binding: Binding<String>, folder: Bool) {
        let panel = NSOpenPanel(); panel.canChooseDirectories = folder; panel.canChooseFiles = !folder; panel.allowsMultipleSelection = false
        if panel.runModal() == .OK, let url = panel.url { binding.wrappedValue = url.path }
    }
    func pathRow(_ title: String, _ value: Binding<String>, folder: Bool) -> some View {
        VStack(alignment: .leading, spacing: 5) { Text(title).font(.caption).foregroundStyle(.secondary); HStack { TextField(title, text: value).textFieldStyle(.roundedBorder); Button("찾아보기") { choose(value, folder: folder) } } }
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                VStack(alignment: .leading, spacing: 9) { Text(kind.title).font(.largeTitle.bold()); Text(subtitle).foregroundStyle(.secondary) }
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: "cpu").foregroundStyle(accent)
                        Text(pathsSet ? URL(fileURLWithPath: model.wrappedValue).lastPathComponent : "생성 모델을 연결해주세요").font(.callout.weight(.medium)).lineLimit(1).truncationMode(.middle)
                        Spacer(); Button(showConnection ? "접기" : "연결 설정") { showConnection.toggle() }
                    }
                    if showConnection || !pathsSet {
                        Text(kind.recommendation).font(.caption).foregroundStyle(.secondary)
                        pathRow("실행 파일", executable, folder: false)
                        pathRow("로컬 모델 폴더", model, folder: true)
                        Text("경로 지정 후 생성 시 모델을 불러옵니다. 가중치와 실행 도구는 별도로 준비해야 합니다.").font(.caption).foregroundStyle(.secondary)
                    }
                }.padding(18).background(Color(nsColor: .controlBackgroundColor), in: RoundedRectangle(cornerRadius: 14)).disabled(vm.busy)
                VStack(alignment: .leading, spacing: 14) {
                    HStack { Text(kind == .speech ? "읽을 내용" : "장면 설명").font(.headline); Spacer(); Text("\(form.prompt.count)자").font(.caption.monospacedDigit()).foregroundStyle(.secondary) }
                    ZStack(alignment: .topLeading) {
                        if form.prompt.isEmpty { Text(kind == .speech ? "예: 안녕하세요. 오늘의 업무를 함께 시작해볼까요?" : "예: 아침 햇살이 비치는 책상 위의 은색 컴퓨터. 따뜻한 분위기, 정돈된 구도…").foregroundStyle(.tertiary).padding(.horizontal, 13).padding(.vertical, 16).allowsHitTesting(false) }
                        TextEditor(text: $form.prompt).font(.body).scrollContentBackground(.hidden).frame(height: 150).padding(8)
                    }.background(Color.primary.opacity(0.025), in: RoundedRectangle(cornerRadius: 12)).overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.primary.opacity(0.10)))
                    if kind == .speech {
                        HStack { Label("한국어", systemImage: "globe"); Spacer(); Text("화자").foregroundStyle(.secondary); TextField("Sohee", text: $form.voice).textFieldStyle(.roundedBorder).frame(width: 130) }.font(.callout)
                    } else {
                        HStack {
                            Label("\(form.width) × \(form.height)", systemImage: "aspectratio").font(.callout.monospacedDigit())
                            Spacer(); Text("\(form.steps)스텝").font(.callout.monospacedDigit()).foregroundStyle(.secondary)
                            if kind == .video { Text("\(form.frames)프레임 요청").font(.callout).foregroundStyle(.secondary) }
                        }
                        if kind == .video {
                            HStack {
                                if form.reference.isEmpty { Button("시작 이미지 추가", systemImage: "photo.badge.plus") { choose($form.reference, folder: false) } }
                                else {
                                    Image(systemName: "photo.fill").foregroundStyle(accent)
                                    Text(URL(fileURLWithPath: form.reference).lastPathComponent).font(.caption).lineLimit(1)
                                    Button("변경") { choose($form.reference, folder: false) }; Button("제거") { form.reference = "" }
                                }
                            }
                        }
                        DisclosureGroup("크기와 생성 옵션") {
                            HStack(spacing: 14) {
                                number("가로", $form.width); number("세로", $form.height); number("스텝", $form.steps); number("시드", $form.seed)
                                if kind == .video { number("프레임", $form.frames) }
                            }.padding(.vertical, 10)
                            Text("가로·세로는 32의 배수입니다. 설정을 바꾸면 속도와 품질이 달라지며, 영상 길이는 실제 결과에서 확인합니다.").font(.caption).foregroundStyle(.secondary)
                        }.font(.callout)
                    }
                    HStack {
                        Text("먼저 설정을 확인한 뒤 생성합니다.").font(.caption).foregroundStyle(.secondary)
                        Spacer()
                        Button("작업 준비", systemImage: "arrow.right") {
                            vm.prepare(MediaInput(kind: kind, executable: executable.wrappedValue, model: model.wrappedValue, prompt: form.prompt, reference: kind == .video ? form.reference : "", width: form.width, height: form.height, steps: form.steps, frames: form.frames, seed: form.seed, voice: form.voice))
                        }.buttonStyle(.borderedProminent).controlSize(.large).disabled(form.prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || !pathsSet)
                    }
                }.padding(22).background(Color(nsColor: .controlBackgroundColor), in: RoundedRectangle(cornerRadius: 18)).disabled(vm.busy)
                if vm.busy {
                    HStack { ProgressView().controlSize(.small); VStack(alignment: .leading) {
                    Text("생성 중 · 다른 화면으로 이동해도 계속됩니다.").font(.callout)
                    if let start = vm.startedAt { TimelineView(.periodic(from: start, by: 1)) { context in
                        Text("경과 \(Int(context.date.timeIntervalSince(start)))초 · 모델 준비 포함").font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                    } }
                }; Spacer(); Button("중단") { vm.stop() } }.padding(16).background(accent.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                }
                if !vm.error.isEmpty { Label(vm.error, systemImage: "exclamationmark.circle").foregroundStyle(.red).textSelection(.enabled) }
                if let r = vm.record, r.input.kind == kind, let d = vm.directory {
                    VStack(alignment: .leading, spacing: 16) {
                        HStack { Text("작업 결과").font(.headline); Spacer(); Text(r.displayStatus).font(.caption.weight(.medium)).padding(.horizontal, 10).padding(.vertical, 5).background(accent.opacity(0.1), in: Capsule()) }
                        if r.status == "prepared" {
                            Text(r.input.prompt).font(.callout).lineLimit(4)
                            Text("확인한 입력으로 생성합니다. 아래 작성란을 수정했다면 작업 준비를 다시 눌러주세요.").font(.caption).foregroundStyle(.secondary)
                            Button("이 설정으로 생성", systemImage: "sparkles") { vm.run() }.buttonStyle(.borderedProminent).controlSize(.large).disabled(vm.busy)
                        }
                        if let image = vm.image { Image(nsImage: image).resizable().scaledToFit().frame(maxHeight: 420).clipShape(RoundedRectangle(cornerRadius: 12)) }
                        if let player = vm.player { VideoPlayer(player: player).frame(height: kind == .speech ? 90 : 360).clipShape(RoundedRectangle(cornerRadius: 12)) }
                        HStack {
                            Button("같은 설정으로 새 작업", systemImage: "arrow.clockwise") { vm.retry() }.disabled(vm.busy || r.input.executable == "cloud-api")
                            Button("Finder에서 보기", systemImage: "folder") { NSWorkspace.shared.open(d) }
                            if let name = r.artifacts.first, r.status == "generated_unreviewed" { Button("원본 열기", systemImage: "arrow.up.right.square") { NSWorkspace.shared.open(d.appendingPathComponent(name)) } }
                            Spacer(); if let seconds = r.elapsedSeconds { Text(String(format: "전체 실행 %.2f초", seconds)).font(.caption.monospacedDigit()).foregroundStyle(.secondary) }
                        }
                        DisclosureGroup("설정과 실행 기록") {
                            Text(r.id).font(.caption.monospaced()).textSelection(.enabled)
                            Text(([r.input.executable] + r.arguments).joined(separator: "\n")).font(.caption.monospaced()).textSelection(.enabled)
                        }
                        if r.status == "generated_unreviewed" { Text("파일 생성 완료. 내용과 품질을 확인한 뒤 사용하세요.").font(.caption).foregroundStyle(.secondary) }
                    }.padding(22).background(Color(nsColor: .controlBackgroundColor), in: RoundedRectangle(cornerRadius: 18))
                }
            }
        }
    }
    func number(_ title: String, _ value: Binding<Int>) -> some View {
        VStack(alignment: .leading, spacing: 5) { Text(title).font(.caption).foregroundStyle(.secondary); TextField(title, value: value, format: .number).textFieldStyle(.roundedBorder).accessibilityLabel(title) }
    }
}
