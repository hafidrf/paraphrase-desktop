#!/usr/bin/env bash
# Launch Paraphrase from source (macOS / Linux)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

export PATH="/opt/homebrew/bin:/usr/local/bin:${PATH:-/usr/bin:/bin}"

OUT_MAIN="$HERE/out/main/index.js"
if [[ ! -f "$OUT_MAIN" ]]; then
  if ! command -v npm >/dev/null 2>&1; then
    echo "npm not found. Install Node.js, then run: npm run build" >&2
    exit 1
  fi
  npm run build
fi

exec npm start
