# H3 AI Computer — Desktop Preview 0.4

A local-first desktop workspace for **macOS, Windows and Linux**. Installed models are the default. Users explicitly choose OpenRouter/compatible APIs or Codex/Claude when online capabilities are useful.

## Run and build

```sh
cd apps/desktop
npm ci
npm start
npm test
npm run smoke
npm run package
```

Node 24 is used for development. Packaged apps contain Electron and the H3 workspace; they do not require Node installation. Model weights, Ollama/LM Studio and modality runtimes are installed separately.

## Workflow

1. Start an installed local model server. In Connections, choose Ollama or LM Studio and list models.
2. Use Chat for streaming conversations, or Agent for scoped text work and media preparation.
3. Select a working folder for an agent. H3 mediates its tools: list/read text, create a new document after approval, or prepare a local media draft. No unrestricted shell tool is provided to the H3 broker.
4. In Media, choose an installed CLI or compatible loopback API. Cloud API is a separate explicit choice with a destination confirmation.
5. Revisit inputs, results and status in Job Library. A created media file still needs quality review.

## Models and APIs

- Ollama: installed models, digest/quantization/file size when available, tag download/update progress. Online model discovery opens the official catalog; H3 does not invent a universal “latest best” model.
- Local chat/agent: compatible `/v1/models` and `/v1/chat/completions`; literal loopback HTTP only. Use an offline-configured server to guarantee offline inference. Cloud model tags are filtered; H3 never automatically falls back to a remote provider.
- OpenRouter: explicit HTTPS connection, model and modality catalogs, capability/price metadata, chat/agent, `/images`, `/audio/speech`, asynchronous `/videos`.
- OpenAI-compatible media: `/images/generations` base64 raster output, `/audio/speech` WAV, `/videos` multipart create/poll/download. Compatibility is per endpoint/model, not universal API compatibility.
- Codex/Claude: optional installed CLI planners using structured output and the same H3 tool broker. Existing CLI login is required. Codex uses an isolated job directory, read-only sandbox and disabled shell/hooks; Claude has built-in tools and MCP disabled. This release does not expose the entire App Server/Agent SDK permission protocol or all CLI plugins.
- The included MLX-Audio, MFLUX and Metal h3.c argument adapters target compatible Apple Silicon runtimes. Windows/Linux users need an OS-compatible runtime or local API server. The desktop package does not make Apple MLX run on NVIDIA.

## Security and operations

The renderer is sandboxed with context isolation and no Node or network access. Narrow IPC operations validate API destinations and workspace paths. Responses render as text, never HTML. Agent tools reject traversal, hidden files and symlinks and cannot overwrite existing documents. API keys are encrypted with Electron safeStorage; if a secure Linux backend is unavailable, keys stay in memory only. Keys are never serialized into job records. Do not treat the loopback address of an externally configured proxy as proof that its backend is offline.

Downloads and remote inference are explicit actions. Cancelling a remote video wait does not cancel provider billing; remote IDs are retained. CLI cancellation targets the owned process; external services have their own lifecycle. Records and prompts are private local plaintext; protect the OS user account. Signed updates, broad runtime installation, full app localization and public code signing/notarization remain follow-on release gates.

The release workflow runs unit tests and a native Electron launch/agent-approval smoke test on each OS before packaging. Those checks are not real GPU/model certification on Windows/Linux.
