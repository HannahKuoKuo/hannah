"""剪片範例：常見操作示範（moviepy 2.x 語法）

執行前先準備一支影片，例如 input.mp4，再執行:
    python3 examples/edit_demo.py input.mp4
"""
import sys

from moviepy import (
    AudioFileClip,
    CompositeVideoClip,
    TextClip,
    VideoFileClip,
    concatenate_videoclips,
)


def main(path: str) -> None:
    clip = VideoFileClip(path)
    print(f"影片長度: {clip.duration:.1f} 秒, 解析度: {clip.size}")

    # 1. 裁切片段（取第 0~5 秒）
    part = clip.subclipped(0, min(5, clip.duration))

    # 2. 加字幕（置中顯示 3 秒）
    title = TextClip(text="我的影片", font_size=48, color="white", duration=3)
    with_title = CompositeVideoClip([part, title.with_position("center")])

    # 3. 調整音量 / 換背景音樂
    # music = AudioFileClip("music.mp3").subclipped(0, with_title.duration)
    # with_title = with_title.with_audio(music)

    # 4. 串接多段影片
    # final = concatenate_videoclips([with_title, another_clip])

    # 5. 輸出
    with_title.write_videofile("output.mp4")
    print("已輸出 output.mp4")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("用法: python3 examples/edit_demo.py <影片檔>")
    main(sys.argv[1])
