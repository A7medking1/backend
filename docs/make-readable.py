"""Turn the Arabic + English Markdown lessons into right-to-left HTML pages.

Usage (from D:\\backend):  python docs/make-readable.py
Output: one .html next to each lesson, plus review-answers.html. Open them in any browser.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = (ROOT / "docs" / "rtl-preview.css").read_text(encoding="utf-8")

PAGE = """<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js"></script>
<style>
body {{ font-family: "Segoe UI", Tahoma, Arial, sans-serif; max-width: 860px; margin: 0 auto; padding: 24px 16px 80px; }}
pre {{ padding: 12px; overflow-x: auto; }}
table {{ border-collapse: collapse; display: block; overflow-x: auto; }}
th, td {{ border: 1px solid; padding: 6px 10px; }}
h1, h2 {{ border-bottom: 1px solid; padding-bottom: 6px; }}
</style>
<style>{css}</style>
</head>
<body>
<main id="content"></main>
<script>
document.getElementById("content").innerHTML = marked.parse({md});
</script>
</body>
</html>
"""


def build(md_path: Path) -> Path:
    md = md_path.read_text(encoding="utf-8")
    title = md.splitlines()[0].lstrip("# ").strip() if md else md_path.stem
    out = md_path.with_suffix(".html")
    out.write_text(PAGE.format(title=title, css=CSS, md=json.dumps(md)), encoding="utf-8")
    return out


if __name__ == "__main__":
    targets = sorted(ROOT.glob("phase-*/lessons/*.md"))
    targets.append(ROOT / "phase-1-node-ts" / "review-answers.md")
    for path in targets:
        if path.exists():
            print("built", build(path).relative_to(ROOT))
