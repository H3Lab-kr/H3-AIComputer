import SwiftUI
import AppKit
struct AgentView: View {
    @Environment(\.locale) private var locale
    @ObservedObject var agent: AgentWorkspace
    let openMedia: (String) -> Void
    private func choose(_ folder: Bool, assign: (String) -> Void) {
        let p = NSOpenPanel(); p.canChooseDirectories = folder; p.canChooseFiles = !folder
        if p.runModal() == .OK, let url = p.url { assign(url.path) }
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text(L("AI에게 작업을 맡기세요")).font(.largeTitle.bold())
                Text(L("내 Mac의 AI가 자료를 읽고, 문서를 만들고, 생성 도구를 준비합니다.")).foregroundStyle(.secondary)
                Picker(L("작업 브레인"), selection: $agent.provider) {
                    Text(L("로컬 AI · 기본")).tag("local")
                    Text(L("Codex · 온라인")).tag("codex")
                    Text(L("Claude · 온라인")).tag("claude")
                }.pickerStyle(.segmented).disabled(agent.busy || agent.connecting)
                GroupBox(agent.provider == "local" ? L("로컬 브레인 연결") : L("선택한 온라인 브레인")) {
                    VStack(alignment: .leading, spacing: 12) {
                        if agent.provider == "local" {
                            HStack { TextField(L("로컬 서버 주소"), text: $agent.endpoint).textFieldStyle(.roundedBorder); Button(L("모델 찾기")) { agent.connect() }.disabled(agent.connecting) }
                            if !agent.models.isEmpty { Picker(L("모델"), selection: $agent.model) { ForEach(agent.models, id: \.self) { Text($0).tag($0) } } }
                            Text(L("설치된 로컬 모델을 사용합니다. H3는 외부 API로 자동 전환하지 않습니다. 오프라인 실행에는 로컬 전용 서버 설정과 준비된 모델이 필요합니다.")).font(.caption).foregroundStyle(.secondary)
                        } else {
                            HStack {
                                TextField(L("CLI 실행 파일"), text: agent.provider == "codex" ? $agent.codexPath : $agent.claudePath).textFieldStyle(.roundedBorder)
                                Button(L("찾아보기")) { choose(false) { if agent.provider == "codex" { agent.codexPath = $0 } else { agent.claudePath = $0 } } }
                            }
                            TextField(L("모델 ID (비우면 CLI 기본 모델)"), text: $agent.cloudModel).textFieldStyle(.roundedBorder)
                            Text(L("인터넷·해당 서비스 로그인이 필요합니다. 요청과 선택한 도구가 읽은 자료는 해당 서비스로 전송됩니다. H3 도구 실행은 아래 승인 흐름을 따릅니다.")).font(.caption).foregroundStyle(.secondary)
                            Link(L("공식 설치·로그인 안내 ↗"), destination: URL(string: agent.provider == "codex" ? "https://developers.openai.com/codex/cli/" : "https://code.claude.com/docs/en/quickstart")!)
                        }
                    }.padding(12).disabled(agent.busy)
                }
                GroupBox(L("컴퓨터 제어 · Mac 프리뷰")) {
                    VStack(alignment: .leading, spacing: 10) {
                        Toggle(L("선택한 앱 제어 허용"), isOn: $agent.computerEnabled)
                        if agent.computerEnabled {
                            Picker(L("대상 앱"), selection: $agent.computerTarget) {
                                Text(L("앱을 선택하세요")).tag(Int32(0))
                                ForEach(agent.computerApps, id: \.processIdentifier) { app in
                                    Text(app.localizedName ?? String(app.processIdentifier)).tag(app.processIdentifier)
                                }
                            }
                            HStack {
                                Button(L("앱 새로고침")) { agent.refreshComputerApps() }
                                Button(L("손쉬운 사용 설정")) { NSWorkspace.shared.open(URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")!) }
                            }
                            Button(L("앱 관찰 요청 넣기")) { agent.prompt = L("선택한 앱의 화면 요소를 관찰하고 할 수 있는 작업을 설명해주세요. 내용을 변경하지 마세요.") }
                            Text(L("화면 읽기·버튼 누르기·텍스트 입력을 매번 확인합니다. 읽은 내용은 선택한 브레인과 작업 기록에 포함됩니다. 민감한 창을 닫고 사용하세요. 중단 시 이미 실행된 작업은 되돌아가지 않습니다.")).font(.caption).foregroundStyle(.secondary)
                        }
                    }.padding(12).disabled(agent.busy)
                }.onAppear { agent.refreshComputerApps() }
                HStack {
                    Label(agent.folder.isEmpty ? L("이 작업에 사용할 폴더") : agent.folder, systemImage: "folder").lineLimit(2).textSelection(.enabled)
                    Spacer(); Button(L("폴더 선택")) { choose(true) { agent.folder = $0 } }.disabled(agent.busy)
                }
                Text(L("사용 도구: 텍스트 목록·읽기 / 새 문서 쓰기 / 음성·이미지·영상 작업 준비")).font(.caption).foregroundStyle(.secondary)
                TextEditor(text: $agent.prompt).frame(minHeight: 100).padding(10).background(Color(nsColor: .controlBackgroundColor), in: RoundedRectangle(cornerRadius: 12)).disabled(agent.busy)
                HStack {
                    Button(L("자료를 읽고 기획하기")) { agent.prompt = L("폴더의 자료를 먼저 확인하고 핵심 내용을 읽은 뒤, 30초 소개 영상 기획안을 새로운 teaser-plan.md 문서로 만들어주세요.") }.disabled(agent.busy)
                    Spacer()
                    if agent.busy { ProgressView().controlSize(.small); Button(L("중단")) { agent.stop() } }
                    else { Button(L("작업 시작"), systemImage: "sparkles") { agent.run() }.buttonStyle(.borderedProminent).disabled(agent.connecting || agent.folder.isEmpty || agent.prompt.isEmpty) }
                }
                if let request = agent.pending {
                    GroupBox(L("실행 전 확인")) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(request.message).font(.headline)
                            Text(request.action.hasPrefix("computer_") ? L("컴퓨터 작업") : request.action == "write_text" ? L("새 문서: {0}", String(describing: request.path)) : L("{0} 생성 작업 준비", String(describing: request.kind))).font(.callout.bold())
                            ScrollView { Text(request.action.hasPrefix("computer_") ? agent.computerPreview : request.action == "write_text" ? request.content : request.prompt).textSelection(.enabled).frame(maxWidth: .infinity, alignment: .leading) }.frame(maxHeight: 220)
                            HStack { Button(L("승인")) { agent.approve(true) }.buttonStyle(.borderedProminent); Button(L("거절")) { agent.approve(false) } }
                            if request.action == "prepare_media" { Text(L("승인하면 작업을 준비합니다. 실제 생성은 해당 생성 화면에서 설정을 확인한 뒤 시작합니다.")).font(.caption) }
                        }.padding(12)
                    }
                }
                if !agent.error.isEmpty { Text(agent.error).foregroundStyle(.red).textSelection(.enabled) }
                if !agent.output.isEmpty { Text(agent.output).textSelection(.enabled).padding(18).frame(maxWidth: .infinity, alignment: .leading).background(Color(nsColor: .controlBackgroundColor), in: RoundedRectangle(cornerRadius: 12)) }
                DisclosureGroup(L("작업 과정 · {0}개 이벤트", String(describing: agent.events.count))) { ForEach(Array(agent.events.enumerated()), id: \.offset) { _, event in Text(event).font(.caption).textSelection(.enabled) } }
                HStack {
                    ForEach(["speech", "image", "video"], id: \.self) { kind in Button(kind == "speech" ? L("음성 작업 보기") : kind == "image" ? L("이미지 작업 보기") : L("영상 작업 보기")) { openMedia(kind) } }
                    Spacer(); if let dir = agent.recordDirectory { Button(L("기록 폴더")) { NSWorkspace.shared.open(dir) } }
                }
            }.padding(4)
        }
    }
}
