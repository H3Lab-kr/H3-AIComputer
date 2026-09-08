# Local model integration screen — 2026-09-09

Development machine: Apple Silicon M5 Max, 128GB unified memory. This is an execution screen with one prompt per modality, not a quality leaderboard or a certified performance preset. Browser development and some software-rendered 3D work overlapped the session; no controlled hardware comparison is claimed.

| Model / runtime | Import + model preparation | First request | Same-process repeats |
|---|---:|---:|---:|
| Qwen3-TTS 1.7B CustomVoice MLX 8bit / MLX-Audio 0.5.3 | 21.30s | 4.90s | 1.76 / 1.72s |
| FLUX.2 klein 4B, runtime 8bit / MFLUX 0.19.1 | 2.04s | 8.75s | 7.60 / 8.26s |
| Qwen3.8-27B MLX 8bit / MLX-VLM 0.7.0 | 4.06s | 10.27s | 8.46 / 8.60s |

TTS produced 9.44 seconds of 24kHz Korean speech. Images were 1024×1024, 4 steps. The LLM generated 108 tokens per request, with generation throughput 12.58 / 13.58 / 13.34 tokens/s. Timings exclude download. Preparation can include lazy model loading; do not equate the preparation column with fully resident GPU weights. End-to-end CLI time is a separate measurement.

MiniMax H3 Turbo8 FL2VA, 384×384, 107 requested frames, 8 steps, video/audio shift 6/3: two independent CLI runs took **64.56 and 73.19 seconds**. These startup-inclusive values cannot be compared directly to resident MLX requests. An earlier shift-12 invocation did not match local Turbo8 metadata and is excluded from the compatible-run result.

Pinned downloads:

- `mlx-community/Qwen3-TTS-12Hz-1.7B-CustomVoice-8bit`: `41d3337e8b7f2843a75841595fc14e4b9a7a4b96`
- `black-forest-labs/FLUX.2-klein-4B`: `e7b7dc27f91deacad38e78976d1f2b499d76a294`
- `mlx-community/Qwen3.8-27B-8bit`: `815b83c0df8ffd1d1b5244cf75fd6ef14fca9ef9`

LFS hashes were checked against the pinned repository metadata for downloaded files; excluded duplicate flat FLUX weights and documentation images were recorded separately. The actual MLX-VLM local HTTP model-list and chat-completion contract also returned a Korean answer; its owned test server was terminated afterward.

Image inspection found the requested silver computer/desk scene, but tiny spurious lettering despite a no-lettering prompt. The LLM's sample answer covered three café tasks with inputs and human checks; forecasting correctness was not evaluated. Audio files and H3 video passed full decoding, but this does not approve pronunciation, voice consistency or full-video motion quality.

Reproduce with `tools/benchmark_models.py` in separately prepared model environments, keeping exact model revisions and package metadata. Use `tools/render_benchmarks.py` to expose the artifacts. Private workstation paths, logs and media are intentionally outside this public report. Before shipping a product, repeat isolated load tests and customer-purpose quality evaluation; do not transfer these numbers to NVIDIA packages.
