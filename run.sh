#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8080}"

echo "Starting Sky Canvas server at http://localhost:$PORT"
echo "Press Ctrl+C to stop."
echo

cd "/home/jordanh/Dev/Wallpaper/"

python3 -m http.server "$PORT" --bind 127.0.0.1
