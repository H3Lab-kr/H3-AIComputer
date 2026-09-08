#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="$(mktemp -d)"
trap 'rm -rf "$TEST_DIR"' EXIT
swiftc -parse-as-library "$ROOT/apps/macos/Sources/AIComputer/MediaJob.swift" "$ROOT/apps/macos/Tests/AIComputerTests/MediaTests.swift" -o "$TEST_DIR/media-tests"
"$TEST_DIR/media-tests"
swiftc -parse-as-library "$ROOT/apps/macos/Sources/AIComputer/MediaJob.swift" "$ROOT/apps/macos/Sources/AIComputer/MediaView.swift" "$ROOT/apps/macos/Tests/AIComputerTests/MediaRunnerTests.swift" -o "$TEST_DIR/runner-tests"
"$TEST_DIR/runner-tests"
