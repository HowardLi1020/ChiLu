"""
把 Claude Code 匯出的對話 zip 轉成好讀的 claude-session/conversation.md
（只保留雙方的文字，省略工具呼叫與截圖）。

用法：python tools/transcript_to_md.py <匯出的 zip 路徑>
"""
import io, json, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "claude-session" / "conversation.md"


def main(zip_path):
    with zipfile.ZipFile(zip_path) as z:
        name = next(n for n in z.namelist() if n.endswith("transcript.jsonl"))
        raw = z.read(name).decode("utf-8")

    out, last = [], None

    def add(role, text, ts):
        nonlocal last
        text = text.strip()
        if not text:
            return
        if role == last == "Claude":
            out.append(text)
            return
        out.append(f"\n---\n\n### {role}　<sub>{ts[:16].replace('T', ' ')} UTC</sub>\n\n{text}")
        last = role

    for line in raw.splitlines():
        if not line.strip():
            continue
        o = json.loads(line)
        ts = o.get("timestamp", "")
        if o["type"] == "user":
            c = o["message"].get("content")
            if isinstance(c, str) and not c.startswith("<"):
                add("使用者", c, ts)
        elif o["type"] == "attachment" and o["attachment"].get("type") == "queued_command":
            add("使用者（Claude 工作中插話）", o["attachment"].get("prompt", ""), ts)
        elif o["type"] == "assistant":
            for b in o["message"].get("content", []):
                if b.get("type") == "text":
                    add("Claude", b["text"], ts)

    head = ("# 對話紀錄\n\n本專案與 Claude Code 的完整對話（只保留雙方的文字，省略工具呼叫與截圖）。\n"
            "專案目前狀態與接手方式請看同資料夾的 [HANDOFF.md](HANDOFF.md)。\n")
    OUT.write_text(head + "\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print(OUT, sum(1 for s in out if s.startswith("\n---\n\n### 使用者")), "則使用者訊息")


if __name__ == "__main__":
    main(sys.argv[1])
