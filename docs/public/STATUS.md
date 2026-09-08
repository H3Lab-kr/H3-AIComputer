# H3: scope and evidence

Updated 2026-09-09.

- **Brand:** H3 AI Computers, by H3Lab. Independent of the MiniMax H3 model publisher.
- **Mac:** native developer Preview 0.4 for local chat, speech, images and video; prepared runtimes/models required. See [app guide](MAC-APP.md).
- **Website:** React/Three.js product and consultation showcase, built locally. NVIDIA Core/Studio/Pro and Mac mini/Studio/Pro integration concepts. The website is not evidence of manufacturing availability, partnership or validated CUDA performance.
- **Production toolkit:** reproducible generation adapters, editing, benchmarks and media checks. No bundled weights or customer productions.
- **Public release:** source allowlist/export tooling exists. The existing MIT source license is retained. Mac signing/notarization remains a separate release requirement.

No historical performance preset is certified. Eight-step video generation is a user-selected policy, not a controlled proof of superiority. A successful process, matching file hash, acceptable visual quality and best cost are different claims. Local timing corrections are never invented.

Automated checks cannot certify Korean speech, identity, intended acting or final video appeal. Report the actual inspected inputs and unreviewed scope. Do not promote AI self-assessments to user approval.

For external collaboration, prepare a minimal reproducer with explicit software/hardware versions, task, input rights, output evidence and a bounded claim. Customer assets, private histories and local model files stay outside public exports.

## Desktop Preview 0.4

A shared Electron desktop client covers local chat/agent, explicit cloud/OpenRouter APIs, CLI planners and model management. Native launch and broker tests run per OS in the release workflow. Application packaging does not bundle or certify GPU/model runtimes. See [desktop guide](../../apps/desktop/README.md) and [product plan](MAC-PRODUCT-PLAN.md).

### Published verification · 2026-09-09

- Source implementation: `ad8d89b`; release [`v0.4.0-preview.1`](https://github.com/H3Lab-kr/H3-AIComputer/releases/tag/v0.4.0-preview.1).
- [Release workflow](https://github.com/H3Lab-kr/H3-AIComputer/actions/runs/34282080932): Windows x64, Linux x64 and macOS arm64 unit tests, native Electron launch, local fixture-agent roundtrip, approval-denial checks, packaging and publication passed.
- All four application archives and adjacent SHA256 files returned HTTP 200 after publication. Native SwiftUI download bytes matched SHA256 `efe1b66d9efc3529bfed7ad6ac0af75d37f9a8434d36131a7ab1189597f4c814`.
- [h3lab.kr](https://h3lab.kr/#download) deployed to production; browser verification found all OS download links, loaded the app screenshot and reported no page errors. Local website suite: 10 passing tests.
- Native SwiftUI fixtures and media runner checks passed. A single live, already-running local LLM agent experiment completed an approved new-text-file task. This is functional evidence, not a general performance benchmark.
- Paid cloud generation and Codex/Claude live inference were not exercised in this release verification. GPU/media compatibility and signing/notarization remain outside the OS launch test claim.
