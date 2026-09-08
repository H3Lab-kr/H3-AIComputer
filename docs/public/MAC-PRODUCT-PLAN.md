# H3 for Mac — product upgrade plan

2026-09-09 · Preview 0.4 release scope

## Product outcome

A returning user can resume a saved conversation; a new user can inspect their Mac and connect a local AI server; creation remains inspectable and cancellable. The native app and website share a blue/navy/gold identity. Performance work targets perceived response latency through streaming, with no unsupported GPU-speed claims.

## Delivery gates

1. Foundation: persistent conversation and drafts with atomic local storage; explicit reset; streaming chat with partial-output/error handling; loopback-only networking remains enforced.
2. Usability: first-run checklist, local server discovery on known loopback ports, clear connection status, live elapsed generation time, retry from recorded inputs, consistent brand styling.
3. Reliability: restore saved input after restart, make interrupted job state visible without relaunching a process, validate stream parsing and record recovery with offline fixtures, compile release bundle.
4. Publication: update bilingual website copy and README to tested capabilities; publish source to GitHub and deploy website; keep the app labeled Preview until public signing/notarization and real-user acceptance are completed.

## Acceptance

- Fragmented SSE events produce ordered Korean text, [DONE] terminates, malformed/error streams fail visibly; cancellation does not fabricate a completed response.
- Conversation survives restart; clearing removes saved content. No cloud credentials or model downloads introduced.
- Known-server discovery uses short bounded timeouts and does not download/start external services.
- A stale running record is shown as interrupted, not completed; retry creates a new record.
- Build, client fixtures and media/recovery tests pass. Website build and relevant browser checks pass before deployment.

## Follow-on milestones

Model installation/repair with disk estimates and resumable downloads; resident media workers measured with real models; full app localization and bundled licensed typography; multimodal inputs; Developer ID signing, notarization, updates and customer pilot. These are subsequent milestones, not claims of this release.

## Expanded user direction — local-first orchestration and all desktops

The default brain is an installed local LLM. Codex, Claude and online APIs are optional explicit providers. Native H3 tools mediate document creation and media preparation; cloud failure must never trigger hidden provider fallback. OpenRouter has separate image/video capability endpoints and generation protocols and is integrated accordingly.

The SwiftUI Mac app remains available. A shared Electron desktop app now targets Mac ARM64, Windows x64 and Linux x64; a per-OS release workflow tests and packages it. Runtime installation and hardware compatibility are separate from application packaging.

### Source decisions, checked 2026-09-09

- [Ollama pull](https://docs.ollama.com/api/pull): tag downloads/updates and streamed progress. Installed versions are shown with metadata where available.
- [Codex App Server](https://developers.openai.com/codex/app-server/): the long-term rich harness path supports threads/events/approvals. Current delivery uses structured CLI planning with H3's own bounded tool broker rather than claiming full App Server coverage.
- [Claude programmatic use](https://code.claude.com/docs/en/headless): structured CLI output with account setup retained in the CLI; H3 manages actual approved tools.
- [OpenRouter image](https://openrouter.ai/docs/guides/overview/multimodal/image-generation), [video](https://openrouter.ai/docs/guides/overview/multimodal/video-generation), [speech](https://openrouter.ai/docs/guides/overview/multimodal/tts): distinct discovery/request contracts. Provider capabilities/pricing are shown rather than guessed.
- [Electron security](https://www.electronjs.org/docs/latest/tutorial/security), [safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage): isolated renderer, narrow IPC and OS-backed encryption with memory-only fallback.

### Verification evidence

Native Swift local Qwen3.8-27B agent completed a new-document task in 8.04 seconds including planning/tool approval in a controlled test folder; this is one functional test, not a performance preset. Desktop unit tests cover endpoint/workspace/action restrictions. The native Electron smoke test exercises local planning and denial of a proposed write. No paid remote image/audio/video generation is included in release verification.
