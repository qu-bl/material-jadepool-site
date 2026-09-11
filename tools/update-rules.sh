#!/usr/bin/env bash
# 重新计算 ai-rules/rules.json（sha256 + version）。
#
# 用法：
#   tools/update-rules.sh                # version 用当前时间
#   tools/update-rules.sh 2026.09.12     # 指定 version
#   MIN_APP_VERSION=1.1.0 tools/update-rules.sh  # 指定最低 App 版本（默认沿用原值/1.0.0）
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

files = []
for name in sorted(f for f in os.listdir(rules_dir) if f.endswith(".md") and f != "README.md"):
    with open(os.path.join(rules_dir, name), "rb") as handle:
        digest = hashlib.sha256(handle.read()).hexdigest()
    files.append({"name": name, "sha256": digest})

if not min_app_version and os.path.exists(manifest_path):
    try:
        min_app_version = json.load(open(manifest_path)).get("minAppVersion", "")
    except Exception:
        min_app_version = ""
if not min_app_version:
    min_app_version = "1.0.0"

manifest = {
    "schemaVersion": 1,
    "version": version,
    "minAppVersion": min_app_version,
    "files": files,
}
with open(manifest_path, "w", encoding="utf-8") as handle:
    json.dump(manifest, handle, ensure_ascii=False, indent=2)
    handle.write("\n")

print(f"updated {manifest_path} (version={version}, minAppVersion={min_app_version})")
for item in files:
    print(f"  {item['name']}  {item['sha256'][:12]}…")
PY
