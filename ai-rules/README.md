# AI 生成规则（可远程更新）

这个目录是「千机百变」AI 生成脚本所用的规则，App **启动时后台拉取更新**，无需发版即可生效。

## 目录内容

| 文件 | 用途 |
| --- | --- |
| `qu-code-skill.md` | 公共能力契约（必读，所有场景共用） |
| `application-script.md` | 「应用脚本」场景规范 |
| `resource-package.md` | 「资源包」场景规范 |
| `rules.json` | 版本清单：`version` + 每个文件的 `sha256` + `minAppVersion` |

App 拉取地址：`https://qu-bl.github.io/one-fuzhu/ai-rules/`

## 如何发布一次更新

1. 修改对应的 `.md` 规则文件；
2. 运行脚本重新生成 `rules.json`：
   ```bash
   tools/update-rules.sh            # version 用当前时间
   # 或指定版本 + 最低 App 版本
   tools/update-rules.sh 2026.09.12
   MIN_APP_VERSION=1.1.0 tools/update-rules.sh 2026.09.12
   ```
3. `git add ai-rules && git commit && git push`；
4. 等 GitHub Pages CDN 生效（约 10 分钟，`max-age=600`；App 拉取时带 `?t=` 绕过缓存）；
5. App 下次启动后即会更新，并弹出一条通知「AI 规则已更新」。

## 兼容性约定

- `minAppVersion`：规则要求的最低 App 版本。App 版本低于它时**忽略该次更新**，继续用缓存/内置规则，避免旧 App 拉到不兼容的新规则。
- 规则的接口事实必须与 App 实际暴露的桥接一致；不兼容的接口变更应通过 `minAppVersion` 配合发版发布。
- 任何拉取/校验失败都不影响 App：继续使用本地缓存或内置 `rawfile`。
