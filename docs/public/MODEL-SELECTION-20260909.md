# Mac M5 Max 128GB model selection — 2026-09-09

These are integration targets selected from current primary documentation, not certified best-performing presets. Weights are supplied separately from the app and public source distribution.

| Capability | Selected model | Runtime | Selection reason |
|---|---|---|---|
| Korean chat and visual understanding | Qwen3.8-27B, MLX 8bit | mlx-vlm | Current 27B vision-language release; Apple Silicon conversion exists; 128GB allows starting with 8bit rather than maximizing compression. |
| Korean speech | Qwen3-TTS-12Hz-1.7B-CustomVoice, MLX 8bit | mlx-audio | Explicit Korean support and preset speaker control; start with Sohee. Voice cloning requires the separate Base variant. |
| Image generation | FLUX.2-klein-4B distilled | MFLUX | Short-step generation and an image-editing family; 4B release has Apache-2.0 terms. The present app exposes text-to-image, not multi-reference editing. |
| Video with audio | Existing MiniMax H3 Turbo8 FL2VA | h3.c | Preserve the user's 8-step production policy and existing assets. Do not equate this with an approved optimum or assume Ref2VA compatibility. |

LLM and TTS MLX model cards identify Apache-2.0. Original model, conversion, runtime and app licenses remain separate. H3 checkpoint/adapter redistribution terms require independent review before bundling. No weights are bundled or published by this project.

## Operation

Run one heavy generation workload at a time. The app prevents concurrent in-app chat/media submissions, but cannot manage external servers' resident weights or jobs. Stop/unload externally managed models before a large H3 job. 128GB is shared by the OS, model weights, activations and caches; file size is not peak runtime memory.

The media adapter uses explicit local CLI paths and model folders. It sets Hugging Face offline environment flags, removes inherited API credentials and H3 tuning variables, and saves the exact arguments. This is not a network sandbox for arbitrary executables. Downloading models remains a separate, deliberate preparation step.

Model downloads and initial local smoke benchmarks were authorized on 2026-09-09. Detailed machine-local logs and outputs are outside the public release under `output/ai-computer-validation-20260909`. A one-prompt screen does not establish Korean quality, human-preference alignment or a market-wide performance ranking.

## Primary references

- [Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B) and [MLX 8bit conversion](https://huggingface.co/mlx-community/Qwen3.8-27B-8bit).
- [Qwen3-TTS CustomVoice](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice), [MLX 8bit conversion](https://huggingface.co/mlx-community/Qwen3-TTS-12Hz-1.7B-CustomVoice-8bit), [MLX-Audio](https://github.com/Blaizzy/mlx-audio).
- [FLUX.2 klein 4B](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B), [MFLUX FLUX.2 documentation](https://github.com/mflux-community/mflux/blob/main/src/mflux/models/flux2/README.md), [local paths](https://github.com/mflux-community/mflux/blob/main/src/mflux/models/common/README.md).
- [h3.c](https://github.com/antirez/h3.c) and [H3 Turbo](https://github.com/ModelTC/Minimax-H3-Turbo). The locally merged Turbo8 provenance must be tracked separately from the project's general Turbo claims.

## H3 schedule compatibility found during the screen

The checked upstream engine hard-codes video/audio sigma shift 12/3. The existing Turbo8 model metadata requests 6/3. The first two upstream runs therefore demonstrate process and media-format operation only. A second screen uses a clean build whose sole source delta is video shift 12→6. The application on this development machine is configured to that explicit binary. A generic `h3` binary must not be assumed to read the model's scheduler metadata automatically.
