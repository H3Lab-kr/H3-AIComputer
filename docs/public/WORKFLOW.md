# Production workflow

1. Define audience, message, duration, framing, dialogue and reference roles before generation.
2. Record one master reference for each recurring character. Derive shot references from that master; compare identity after every edit. Reference images help, but do not guarantee identity.
3. Keep a shot's action simple. Specify starting state, action, final state, camera and audio. Separate speech from soundscape and music in model-specific prompts.
4. Use published engines and matching model schedules. Eight steps is this project's local production policy, not a universal optimum. The H3 wrapper supplies no private engine patches, merged weights, or verified performance preset.
5. Review the actual frames and waveform. Check dialogue, pronunciation, identity, anatomy, temporal artifacts and lip sync separately. ASR and similarity scores do not certify perceptual quality.
6. Edit with enough speech tail and readable caption time. Use one narrator where possible, measure mix loudness, and review the final encoded audio. Transition sound effects are optional, not mandatory.
7. Keep original clips, selected inputs, commands, model identity, prompts and output hashes. Log a failed take as failed; never silently correct timings or promote model review to human approval.

## Layout of a private job

`productions/YYYYMMDDTHHMMSSffffff+0900__topic__stage/` may contain:

- `brief.md`: purpose, audience, acceptance and failure criteria.
- `request.json`: actual model/engine, prompt, references, seed and settings.
- `assets/`, `clips/`, `edit/`: original inputs, generation and assembly.
- `review/`: media checks, visual notes, audio-review method and limits.
- `final.mp4`, `index.html`: deliverable and viewing page.

These are private by default. Only sanitized, reusable tools belong in the public source tree.

## Compact brief template

Purpose / audience / duration / aspect ratio / dialogue / required action / identity reference / acceptable changes / rejection criteria / generation budget / review method / selected files and hashes / unresolved issues / user review state.
