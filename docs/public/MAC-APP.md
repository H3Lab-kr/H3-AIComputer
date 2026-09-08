# H3 for Mac — Developer Preview 0.3

Native SwiftUI workspace for chat, Korean speech, image and video generation. Apple Silicon, macOS 14+. Build tested on the development Mac; this is not a certification of every Mac configuration.

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
- App-owned `mlx_vlm.server`: `http://127.0.0.1:1235/v1`, one concurrent sequence, maximum 2048 output tokens. After starting, check the connection when the model is ready. Stop releases this owned process.

Chat uses `/v1/models` and `/v1/chat/completions`, without streaming or API authentication. The endpoints follow [LM Studio](https://lmstudio.ai/docs/developer/openai-compat) and [Ollama](https://docs.ollama.com/api/openai-compatibility). Requests accept literal loopback IPs only, and disable redirects and HTTP proxies. A locally connected server can still call cloud services: inspect the runtime to determine actual offline behavior.

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

The sidebar separates creation from connections. Drafts survive in-app navigation, but unsaved drafts and chat are not retained after quitting. Generated job history persists. Successful file creation is marked `generated_unreviewed`; full decode, content accuracy and aesthetic quality are separate checks. CLI elapsed time includes startup and model loading, not only GPU execution.

## Verification

```sh
python3 apps/macos/Tests/run_fixture.py
bash scripts/test-mac-app.sh
```

Offline tests cover the loopback client, literal argument serialization, timestamped records, default video settings, missing/empty results, environment filtering, successful/failed fake workers and cancellation. They do not substitute for real model generation or human review. Local model screens are separately recorded and are not universal performance claims.

Still to implement: guided installs/repair, model download UI, persistent media workers, reference-based image editing UI, multimodal chat inputs, restart recovery, authenticated servers, signed updates and public notarization. NVIDIA hardware packages do not imply this SwiftUI app runs on Windows/Linux.
