#!/usr/bin/env bash
# 重新计算 ai-rules/rules.json（每个规则文件独立 version + sha256）。
#
# 应用脚本与资源包规则完全独立：内容未变的文件会沿用旧 version，只有真正改动的那份才升级版本。
#
# 用法：
#   tools/update-rules.sh                # 改动的文件用当前时间做 version
#   tools/update-rules.sh 2026.09.12     # 指定 version（只作用于本次改动的文件）
#   MIN_APP_VERSION=1.1.0 tools/update-rules.sh  # 覆盖最低 App 版本（默认沿用原值/1.0.0）
#
# 改完这个脚本生成的 rules.json + 规则 md，git push 后约 10 分钟 CDN 生效。
set -euo pipefail
cd "$(dirname "$0")/.."

DIR="ai-rules"
VERSION="${1:-$(date +%Y.%m.%d.%H%M)}"
MIN_APP_VERSION="${MIN_APP_VERSION:-}"

python3 - "$DIR" "$VERSION" "$MIN_APP_VERSION" <<'PY'
import hashlib, json, os, sys

rules_dir, version, min_app_version = sys.argv[1], sys.argv[2], sys.argv[3]
manifest_path = os.path.join(rules_dir, "rules.json")

previous = {}
if os.path.exists(manifest_path):
    try:
        for item in json.load(open(manifest_path, encoding="utf-8")).get("files", []):
            previous[item.get("name", "")] = item
    except Exception:
        previous = {}

files = []
for name in sorted(f for f in os.listdir(rules_dir) if f.endswith(".md") and f != "README.md"):
    with open(os.path.join(rules_dir, name), "rb") as handle:
        digest = hashlib.sha256(handle.read()).hexdigest()
    old = previous.get(name, {})
    # 内容未变的文件沿用旧 version，只有真正改动的那份才用新 version。
    unchanged = old.get("sha256") == digest
    file_version = old.get("version", version) if unchanged else version
    file_min = min_app_version or old.get("minAppVersion") or "1.0.0"
    files.append({"name": name, "version": file_version, "minAppVersion": file_min, "sha256": digest})

manifest = {"schemaVersion": 2, "files": files}
with open(manifest_path, "w", encoding="utf-8") as handle:
    json.dump(manifest, handle, ensure_ascii=False, indent=2)
    handle.write("\n")

print(f"updated {manifest_path}")
for item in files:
    print(f"  {item['name']}  version={item['version']}  minAppVersion={item['minAppVersion']}  {item['sha256'][:12]}…")
PY
