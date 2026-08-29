import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.refs = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"])
        for name in ("href", "src"):
            if values.get(name):
                self.refs.append(values[name])


def validate_page(path):
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    duplicates = {value for value in parser.ids if parser.ids.count(value) > 1}
    assert not duplicates, f"{path}: duplicate ids {duplicates}"

    for ref in parser.refs:
        parts = urlsplit(ref)
        if parts.scheme or parts.netloc or not parts.path or parts.path.startswith("/"):
            continue
        target = (path.parent / parts.path).resolve()
        if target.is_dir():
            target = target / "index.html"
        assert target.exists(), f"{path}: missing local reference {ref}"


for page in (ROOT / "index.html", ROOT / "guide" / "index.html"):
    validate_page(page)

activities = json.loads((ROOT / "data" / "activities.json").read_text(encoding="utf-8"))
cases = json.loads((ROOT / "data" / "cases.json").read_text(encoding="utf-8"))
for item in activities + cases:
    cover = ROOT / item["cover"].removeprefix("./")
    assert cover.exists(), f"missing cover: {cover}"

print(f"validated 2 pages, {len(activities)} activities, {len(cases)} cases")
