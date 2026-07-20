#!/usr/bin/env bash
# 剪片環境一鍵安裝腳本
# 用法: bash setup-video-editing.sh
set -euo pipefail

echo "==> 安裝 ffmpeg（影片轉檔/剪輯核心工具）..."
if ! command -v ffmpeg >/dev/null 2>&1; then
    apt-get update -qq || true
    apt-get install -y -qq ffmpeg
fi
ffmpeg -version | head -1

echo "==> 安裝 Python 剪輯函式庫..."
pip3 install --quiet -r "$(dirname "$0")/requirements.txt"

echo "==> 驗證安裝..."
python3 - <<'EOF'
import moviepy, cv2, ffmpeg, PIL
print("moviepy", moviepy.__version__)
print("opencv", cv2.__version__)
print("pillow", PIL.__version__)
print("ffmpeg-python OK")
EOF

echo "✅ 剪片環境安裝完成！"
