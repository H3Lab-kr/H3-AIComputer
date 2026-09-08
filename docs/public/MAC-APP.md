# H3 for Mac — Developer Preview 0.4.1

Native SwiftUI workspace for chat, Korean speech, image and video generation. Apple Silicon, macOS 14+. Build tested on the development Mac; this is not a certification of every Mac configuration.

## Preview 0.4.1

- Streaming answers with observed time to first content (includes server wait).
- Saved conversation and creation drafts; local server discovery on three known ports.
- First-run checklist, automatic readiness checks for an app-owned server, live generation elapsed time, retry from recorded inputs, interrupted-job recovery.
- Blue/navy workspace, gold H3 identity and a native app icon.

[Download the Apple Silicon Preview ZIP](../../apps/web/public/downloads/H3-Mac-0.4.1-preview.zip). Unzip and move H3.app to Applications. This build has local ad-hoc signing; **Developer ID signing/notarization is not yet available**, so macOS may block first launch. The source build below remains available. Do not disable Gatekeeper globally. The archive contains the app only; models and runtimes are installed separately.

## Build and first use

```sh
bash scripts/build-mac-app.sh
open "dist/H3.app"
```

Apple Command Line Tools are required for the build. The app itself needs no Python or third-party Swift packages. The generated bundle is locally ad-hoc signed, not Developer ID signed/notarized for public distribution. Model runtimes and weights are separately prepared; there is no bundled model or automatic installation wizard.

1. Open **모델과 연결**. Choose a running local server, or select an installed MLX server executable and a compatible local model folder.
2. Open **대화**, **음성**, **이미지**, or **영상**. Set the content first; connection details and advanced generation settings expand separately.
3. Prepare a media job, inspect its arguments, generate and review. Use the library to reopen the output, original file and logs.

## Connections

- LM Studio: `http://127.0.0.1:1234/v1`
- Ollama: `http://127.0.0.1:11434/v1`
- App-owned `mlx_vlm.server`: `http://127.0.0.1:1235/v1`, one concurrent sequence, maximum 2048 output tokens. After starting, check the connection when the model is ready. Stop terminates this owned process. Readiness is probed automatically before enabling connection.

Chat uses `/v1/models` and streaming `/v1/chat/completions`, without API authentication. The endpoints follow [LM Studio](https://lmstudio.ai/docs/developer/openai-compat) and [Ollama](https://docs.ollama.com/api/openai-compatibility). Requests accept literal loopback IPs only, and disable redirects and HTTP proxies. A locally connected server can still call cloud services: inspect the runtime to determine actual offline behavior.

## Media adapters

| Workspace | Executable / model | Current default |
|---|---|---|
| Speech | `mlx_audio.tts.generate`, local Qwen3-TTS CustomVoice | Korean, Sohee, joined WAV |
| Image | `mflux-generate-flux2`, local FLUX.2 klein 4B | 1024px, 4 steps, 8bit runtime quantization |
| Video | compatible `h3`, local H3 model | 384px, 107 requested frames, 8 steps, optional first frame |

The video adapter explicitly uses 50 layers, reuse/core-reuse 1 and reference RoPE. Match engine scheduling to the model: the local Turbo8 metadata uses video/audio shift 6/3. These defaults are recorded choices, not approved performance or losslessness presets. CLI contracts were checked against MLX-Audio 0.5.3 and MFLUX 0.19.1; see [model selection](MODEL-SELECTION-20260909.md).

Only one app-managed media process runs at once. Stop the owned text server before media generation; external servers and other apps remain the operator's responsibility. Cancellation terminates the directly launched process, escalating after three seconds. It does not manage every external subprocess tree.

## Data and review

The historical local storage directory remains `~/Library/Application Support/AI Computer/Jobs/` to preserve existing jobs after rebranding. Each unique timestamped folder records `request.json`, exact arguments, stdout/stderr and outputs. Server logs have separate `Servers` folders. Executable/model paths persist in preferences. Prepared jobs contain their prompts.

The sidebar separates creation from connections. Conversation and chat draft persist atomically in `conversation.json` beside Jobs. Media drafts persist in local preferences. New Conversation clears the saved conversation and chat draft. A complete exchange enters history only after streaming finishes; cancelled/failed partial output is labeled separately, with the input restored. Generated job history persists. On startup, unfinished running records become interrupted; retry creates a new timestamped record. Successful file creation is marked `generated_unreviewed`; full decode, content accuracy and aesthetic quality are separate checks. CLI elapsed time includes startup and model loading, not only GPU execution.

## Verification

```sh
python3 apps/macos/Tests/run_fixture.py
bash scripts/test-mac-app.sh
```

Offline tests cover the loopback client, literal argument serialization, timestamped records, default video settings, missing/empty results, environment filtering, successful/failed fake workers and cancellation. They do not substitute for real model generation or human review. Local model screens are separately recorded and are not universal performance claims.

Next milestones: guided installs/repair, model download UI, persistent media workers, reference-based image editing UI, multimodal chat inputs, authenticated servers, signed updates and public notarization. NVIDIA hardware packages do not imply this SwiftUI app runs on Windows/Linux.

## Release verification — 2026-09-09

Release build and offline client/media tests passed, including fragmented Korean SSE, truncated/malformed streams, conversation round-trip/clear, draft restoration, interrupted-job recovery, process failures and cancellation. A real local Qwen3.8-27B MLX 8bit stream returned a Korean answer: first content 0.663s, complete answer 2.326s. This is one request after server startup, not a throughput comparison or app-wide acceleration claim. Home screen was visually inspected. Full customer acceptance and public signing remain release gates.


## Preview 0.4.1 · Speech playback and languages

Choose **한국어 / English** in the header. The preference persists between launches; navigation, generation, model management, agent approvals and H3 error messages are translated. User documents, prompts, model IDs, runtime logs and existing job records remain unchanged. Speech language has its own Korean/English selector, independent of interface language.

Two local macOS 26.6.2 crash reports terminated with SIGABRT in `_AVKit_SwiftUI` generic superclass metadata initialization. Both associated speech jobs already had a successful record and WAV output. The native app now wraps AppKit `AVPlayerView` directly instead of SwiftUI `VideoPlayer`, for both local and cloud media previews.

Verification: local Qwen3-TTS generation through `MediaWorkspace`, mounting the real `MediaView`, preview readiness and advancing playback passed. Automated native tests exercise player mount, play, replacement and teardown; language templates preserve argument placeholders; the actual ContentView switches English → Korean → English without replacing its workspace.

```sh
bash scripts/test-mac-app.sh
bash scripts/test-mac-localization.sh output/mac-localization
python3 apps/macos/Tests/run_fixture.py
```

The localization test captures actual rendered native views when given an output directory. README.md uses the English capture; README.ko.md uses Korean. These fixes apply to the native SwiftUI Mac app; the shared Electron Desktop Preview remains a separate download.
