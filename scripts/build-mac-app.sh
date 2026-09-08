#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
swift build --package-path "$ROOT/apps/macos" -c release
BINARY_DIR="$(swift build --package-path "$ROOT/apps/macos" -c release --show-bin-path)"
APP="$ROOT/dist/H3.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
ICON_TMP="$(mktemp -d)"
trap 'rm -rf "$ICON_TMP"' EXIT
swift "$ROOT/scripts/make-mac-icon.swift" "$ICON_TMP/icon.png"
mkdir -p "$ICON_TMP/H3.iconset"
for size in 16 32 128 256 512; do
    sips -z "$size" "$size" "$ICON_TMP/icon.png" --out "$ICON_TMP/H3.iconset/icon_${size}x${size}.png" >/dev/null
    double=$((size * 2))
    sips -z "$double" "$double" "$ICON_TMP/icon.png" --out "$ICON_TMP/H3.iconset/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$ICON_TMP/H3.iconset" -o "$APP/Contents/Resources/H3.icns"
cp "$BINARY_DIR/H3" "$APP/Contents/MacOS/H3"
cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>H3</string>
<key>CFBundleIdentifier</key><string>dev.aicomputer.preview</string>
<key>CFBundleIconFile</key><string>H3</string>
<key>CFBundleName</key><string>H3</string>
<key>CFBundleDisplayName</key><string>H3</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>0.4.1</string>
<key>CFBundleVersion</key><string>2</string>
<key>LSMinimumSystemVersion</key><string>14.0</string>
<key>CFBundleLocalizations</key><array><string>ko</string><string>en</string></array>
<key>NSHighResolutionCapable</key><true/>
<key>NSAppTransportSecurity</key><dict><key>NSAllowsLocalNetworking</key><true/></dict>
</dict></plist>
PLIST
codesign --force --sign - "$APP"
printf '%s\n' "$APP"
