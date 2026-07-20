#!/usr/bin/env bash
# 一鍵安裝剪片環境：ffmpeg + Python 剪輯函式庫
set -euo pipefail

echo "==> 安裝 ffmpeg..."
if ! command -v ffmpeg >/dev/null 2>&1; then
    apt-get update -qq || true
    apt-get install -y -qq ffmpeg
fi
ffmpeg -version | head -1

echo "==> 安裝 Python 剪輯函式庫..."
pip3 install --quiet -r "$(dirname "$0")/requirements.txt"

echo "==> 驗證..."
python3 -c "import moviepy, cv2, PIL, ffmpeg; print('moviepy', moviepy.__version__); print('opencv', cv2.__version__)"
echo "完成！"
