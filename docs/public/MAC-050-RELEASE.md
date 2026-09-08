# H3 Mac 0.5.0 Preview — Computer control

H3 now connects its local-first task planner to selected Mac applications through native Accessibility APIs. Optional Codex and Claude planners use the same H3 approval broker.

## Use it

1. Open the application you want to work with, then open **AI Agent** in H3.
2. Enable **Computer control**, choose that application and allow H3 in macOS **Privacy & Security → Accessibility** if requested.
3. Connect your installed local model, choose a workspace for documents, and use **Try observing the app** or enter a task.
4. Review each observation and action. Press **Stop** to prevent subsequent actions.

Supported actions: observe semantic interface elements, focus the selected app, press an advertised button, and replace an editable text field's value. Observed element references expire after 60 seconds or an action. Secure text fields are excluded. The app checks the target and element again before execution.

Observation content enters the selected brain's context and local task records. An online brain sends it to that service. Close sensitive windows first. App selection scopes direct access; clicking a link can still cause effects in other apps. Completed operations cannot automatically be undone.

## Verified locally on 2026-09-09

- Capability expiry, invented references, unsupported actions, oversized text, replay and revoked permissions reject execution.
- Fake local-model integration: observation does not happen before approval; denial and stop produce no read.
- Real, separate AppKit fixture: observe → replace Korean/English text → re-observe → press button → verify the saved file. Secure-field content is absent from the observation.
- Existing native media, language and client checks remain in the test suite.

The live fixture verifies the executor, not an LLM's task-solving ability. General app compatibility and real-model multi-step success rates are not yet established. GUI apps without usable Accessibility elements, arbitrary pointer/keyboard control and Windows/Linux OS control are not included in this preview.

## Install / 한국어 안내

[Download Apple Silicon Mac ZIP](../../apps/web/public/downloads/H3-Mac-0.5.0-preview.zip). Quit the old app, unzip and replace it in Applications. Local ad-hoc signing only; Developer ID notarization is still pending. Do not disable Gatekeeper globally. Models and runtimes are installed separately.

**AI 에이전트 → 컴퓨터 제어 → 대상 앱 선택**에서 시작하세요. 화면을 읽는 작업도 승인 후 실행합니다. 손쉬운 사용 권한은 새 배포 앱에 별도로 허용해야 할 수 있습니다. 중단은 이미 실행한 동작을 되돌리지 않습니다.

[Research and staged roadmap](AI-COMPUTER-STRATEGY-20260909.md)
