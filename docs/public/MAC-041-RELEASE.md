# H3 Mac Preview 0.4.1

- **Speech preview fix:** replace SwiftUI VideoPlayer with an AppKit AVPlayerView wrapper to avoid the reported macOS 26.6.2 framework initialization crash after successful speech generation. Applies to local and cloud previews.
- **한국어 / English:** switch native app language from the header without restarting. H3 navigation, creation forms, agent approvals and error messages are localized. User content and job records stay intact.
- **Speech language:** separate Korean/English selection for local TTS, saved with the draft.
- **Verification:** live local Qwen3-TTS generation and preview playback; native player lifecycle regression; rendered UI language switching; local client and agent tests.

Download the ZIP, quit H3, extract it and replace the previous H3.app. Existing models, conversations and jobs remain in their original locations. If generation completed before the old app crashed, reopen that result from the job library; regeneration is not required.

This is the native Apple Silicon macOS 14+ app. The shared Electron desktop package is a separate product build. The app is ad-hoc signed, without Developer ID signing/notarization; models and runtimes are separate installations.
