#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="$(mktemp -d)"
FIXTURE_PID=""
cleanup() { if [ -n "$FIXTURE_PID" ]; then kill "$FIXTURE_PID" 2>/dev/null || true; fi; rm -rf "$TEST_DIR"; }
trap cleanup EXIT
swiftc -parse-as-library "$ROOT/apps/macos/Tests/AIComputerTests/ComputerFixtureApp.swift" -o "$TEST_DIR/fixture"
swiftc -parse-as-library "$ROOT/apps/macos/Sources/AIComputer/Localization.swift" "$ROOT/apps/macos/Sources/AIComputer/ComputerControl.swift" "$ROOT/apps/macos/Tests/AIComputerTests/ComputerLiveTests.swift" -o "$TEST_DIR/live-test"
"$TEST_DIR/fixture" "$TEST_DIR/result.txt" &
FIXTURE_PID=$!
"$TEST_DIR/live-test" "$FIXTURE_PID" "$TEST_DIR/result.txt"
