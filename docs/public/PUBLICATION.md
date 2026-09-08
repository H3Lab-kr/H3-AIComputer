# Publication procedure

1. Retain the existing MIT license text in `LICENSE` and include it in `public-files.json`. Do not imply that it relicenses external engines, weights or client work.
2. Run offline tests and the example. Check model-specific tools with the runtime you plan to support; no paid inference is part of release preparation.
3. Run `tools/export_public.py` into a new `dist/` directory. Inspect the exact files and `PUBLIC-EXPORT.json`. The allowlist deliberately excludes local instructions, research snapshots and customer production folders.
4. Review the exported source for secrets, personal/client material, unsupported claims and licensing. The automated pattern scan is heuristic. Any credential found in historical commits must be treated separately; `.gitignore` does not remove tracked content or history.
5. Use a Git repository **inside the reviewed export** when ready. For the existing H3Lab-kr/H3-AIComputer remote, attach the reviewed public tree to its current main commit and use a normal fast-forward push, preserving remote history. For a genuinely new remote, start a new history. Do not blindly push the existing private repository or use `git add -f` on ignored folders. No history rewrite or remote publication is performed by this preparation task.
6. Add a remote and publish only when the repository owner explicitly requests publication.

## Working locally

Keep editing reusable code in `tools/` and add deliberate, reviewed files to the manifest. Store outputs in ignored `output/` or `productions/`. New public documentation belongs in `docs/public/`; older research and client attachments remain local. `.env` files and variants are ignored at all depths; `.env.example` is intentionally blank.

The existing private Git index can still show historical deletions and tracked paths that now match ignore rules. They are not restored, staged, rewritten or removed by the exporter. The new distribution contains only current allowlisted files and no old commit objects.

## Public brand film

The explicit `public-assets.json` entry permits the generated H3 brand MP4 beyond the ordinary source-file size cap only when its SHA256 and maximum size match. It does not permit arbitrary large files or customer assets. Re-rendering requires review and updating that exact hash. Models and production folders remain excluded.
