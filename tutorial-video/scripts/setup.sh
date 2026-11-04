#!/usr/bin/env bash
# One-time setup: checks tools, installs the free offline voice engine (Kokoro) and downloads its model.
# Model goes to $TUTORIAL_TTS_DIR (default ~/.cache/tutorial-video/kokoro).
set -e
DIR="${TUTORIAL_TTS_DIR:-$HOME/.cache/tutorial-video/kokoro}"
ok(){ echo "  [ok] $1"; }; bad(){ echo "  [missing] $1"; MISSING=1; }
echo "Checking tools..."
command -v ffmpeg >/dev/null && ok ffmpeg || bad "ffmpeg (install: apt install ffmpeg / brew install ffmpeg)"
command -v node   >/dev/null && ok node   || bad "node 18+"
command -v python3 >/dev/null && ok python3 || bad "python3"
node -e "require('playwright')" 2>/dev/null && ok playwright || { echo "  installing playwright..."; npm i -g playwright >/dev/null 2>&1 && npx playwright install chromium >/dev/null 2>&1 && ok playwright || bad "playwright (npm i -g playwright && npx playwright install chromium)"; }
python3 -c "import kokoro_onnx, soundfile, PIL" 2>/dev/null && ok "python packages" || { echo "  installing python packages..."; pip install -q kokoro-onnx soundfile pillow 2>/dev/null || pip install -q --break-system-packages kokoro-onnx soundfile pillow; python3 -c "import kokoro_onnx, soundfile, PIL" && ok "python packages"; }
mkdir -p "$DIR"; B=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  if [ -s "$DIR/$f" ]; then ok "$f"; else echo "  downloading $f ..."; curl -fsSL -o "$DIR/$f.part" "$B/$f" && mv "$DIR/$f.part" "$DIR/$f" && ok "$f" || bad "$f (needs access to github.com)"; fi
done
[ -z "$MISSING" ] && echo "READY" || { echo "NOT READY - fix the items above"; exit 1; }
