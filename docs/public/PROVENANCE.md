# Code extraction and third-party boundaries

The public tools are extracted or generalized from the local production workflow:

| Public tool | Origin / change |
|---|---|
| `render_film.py` | Replaces per-production Pillow/FFmpeg edit and delivery scripts with a JSON-driven, asset-independent renderer. No client identity, logo or absolute workstation path. |
| `narrate.py` | Generalizes Gemini narration scripts: script/voice/model arguments, environment key, explicit request and local provenance. |
| `verify_media.py` | Extracts full decode, metadata and hash checks from delivery verification scripts. |
| `generate_h3.py` | New dry-run-first adapter for the engine CLI used locally. Not a replacement engine; actual inference still needs task-compatible external runtime and weights. |
| `quality_gate.py`, `audio_tail.py` | Existing local analysis code; runtime executables now configurable. Metrics remain advisory. |
| `imageedit_multi.py` | Existing multi-reference API helper; key now from environment and runtime configurable. Provider-specific behavior must be checked before paid use. |

Original client scripts and their assets remain under ignored `productions/`. They are not deleted or rewritten as historical evidence. Their dozens of bespoke copies are not exposed by wildcard exceptions.

No vendor engine code, model weights, third-party source snapshots, bundled FFmpeg executable, font, stock image, music, client PDF/spreadsheet, generated voice or video is distributed here. Obtain dependencies under their own terms. Installing this project grants no rights to those materials.

Upstream identification links (not a claim of present feature availability):
- https://github.com/antirez/h3.c
- https://github.com/ModelTC/Minimax-H3-Turbo

Project licensing must be explicitly selected before public release. A clean export avoids carrying the private repository's historical third-party snapshots into a new public history.
