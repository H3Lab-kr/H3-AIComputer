#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="$(mktemp -d)"
trap 'rm -rf "$TEST_DIR"' EXIT
python3 - "$ROOT" "$TEST_DIR" <<'PY'
from pathlib import Path
import sys,subprocess
root=Path(sys.argv[1]);tmp=Path(sys.argv[2]);source=root/'apps/macos/Sources/AIComputer'
(tmp/'App.swift').write_text((source/'App.swift').read_text().replace('@main struct H3App','struct H3App'))
result=subprocess.run(['swiftc','-parse-as-library',*[str(p) for p in source.glob('*.swift') if p.name!='App.swift'],str(tmp/'App.swift'),str(root/'apps/macos/Tests/AIComputerTests/LocalizationUITests.swift'),'-o',str(tmp/'ui-tests')],capture_output=True,text=True)
if result.returncode:
    diagnostic=result.stderr[-10000:].replace('%','%25').replace('\r','%0D').replace('\n','%0A')
    print('::error::Native UI test compilation: '+diagnostic,flush=True)
    raise SystemExit(result.returncode)
PY
"$TEST_DIR/ui-tests" "$@"
