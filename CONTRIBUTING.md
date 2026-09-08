# Contributing to H3

H3 connects established AI runtimes to useful desktop workflows. We prioritize clear setup, reproducible behavior, Korean speech quality and the cost of producing usable outputs.

Project source follows the existing [MIT License](LICENSE). External runtimes, models, fonts and media retain their own terms.

## Useful contributions

- Native Mac workflow and accessibility improvements.
- Runtime integrations with explicit supported model/task/version boundaries.
- Reproducible hardware and Korean-language quality reports.
- Test coverage for process lifecycle, errors, cancellation and media review.
- Documentation that distinguishes measurements from hypotheses.

## Before changing code

Read README.md and docs/public/STATUS.md. Use isolated environments and new output folders. Never bundle model weights, API credentials, customer assets or private prompts. Keep downloads and billable generation out of CI and default tests.

For a benchmark, include device, runtime version, model/adapter revision, actual invocation, prompt rights, output dimensions, repetitions, timing scope and raw evidence. Report failures without correcting measurements with arbitrary constants. A successful decode is not aesthetic approval.

## Local checks

```sh
bash scripts/build-mac-app.sh
bash scripts/test-mac-app.sh
python3 apps/macos/Tests/run_fixture.py
# In the Python environment containing requirements.txt:
python -m unittest discover -s tests
# Website, when working on it:
npm --prefix apps/web ci
npm --prefix apps/web run build
npm --prefix apps/web test
```

Prepare a focused change and describe the user-visible behavior, validation and remaining limits. Source release preparation uses public-files.json and tools/export_public.py; it does not publish or preserve private Git history. External issues, messages and publication remain owner-controlled actions.
