# hannah

## 剪片環境

本 repo 附有剪片（影片剪輯）環境的一鍵安裝腳本。

### 安裝

```bash
bash setup-video-editing.sh
```

### 包含的工具

| 工具 | 用途 |
|------|------|
| ffmpeg / ffprobe | 轉檔、壓縮、裁切、合併、抽音軌（指令列） |
| moviepy | Python 高階剪輯：裁切、串接、字幕、轉場、配樂 |
| ffmpeg-python | 在 Python 裡呼叫 ffmpeg |
| opencv | 影格級處理、濾鏡、影像分析 |
| pillow | 圖片處理（縮圖、浮水印素材） |

### 快速上手

常用 ffmpeg 指令：

```bash
# 裁切第 10~30 秒
ffmpeg -i input.mp4 -ss 10 -to 30 -c copy cut.mp4

# 轉成 mp4 並壓縮
ffmpeg -i input.mov -c:v libx264 -crf 23 -c:a aac output.mp4

# 抽出音軌
ffmpeg -i input.mp4 -vn -c:a copy audio.m4a

# 影片轉 GIF
ffmpeg -i input.mp4 -vf "fps=12,scale=480:-1" output.gif
```

Python 剪輯範例見 [`examples/edit_demo.py`](examples/edit_demo.py)：

```bash
python3 examples/edit_demo.py input.mp4
```
