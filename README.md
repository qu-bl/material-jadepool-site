# 千机百变应用内官网

纯静态 GitHub Pages 项目，用作 RiveLab 内置 WebView 的官方展示，以及“官方与伙伴们的创意橱柜”。

## 内容结构

- `index.html`：包含官方介绍的首屏活动轮播和创意橱柜
- `data/activities.json`：官方活动 Banner 数据
- `data/cases.json`：官方与伙伴案例卡片数据
- `assets/activities/`：活动 WebP 海报
- `assets/cases/`：伙伴案例 WebP 封面
- `assets/platforms/`：弹窗内使用的平台 SVG Logo
- `assets/favicon.svg`：由圆形与圆角矩形组成的极简网站图标

## 新增官方活动

1. 将活动 WebP 放入 `assets/activities/`。
2. 在 `data/activities.json` 增加一条记录。
3. 需要用户获取信息时，配置与案例相同的 `access.items`。

“制作指南与入驻共创”作为长期官方活动保留在轮播中，统一弹窗显示金山文档信息，不再维护自建指南页面。

## 新增创意案例

1. 将 16:10 WebP 封面放入 `assets/cases/`。
2. 在 `data/cases.json` 增加一条记录。
3. 填写名称、作者、分类、运行平台、标签和 `access.items`；官方案例将作者写为“千机百变官方”。
4. 页面会根据当前结果顺序自动组合大卡、标准卡和宽卡；将重点案例放在数据前部即可。
5. 使用 `visible` 临时隐藏失效案例。

平台仅使用 `Apple`、`Android` 和 `HarmonyOS` 三个数据值，页面会自动显示为对应图标。

所有案例和官方活动共用同一套获取信息弹窗。弹窗只显示具体平台的 Logo 和提示，不直接展示被复制的内容；点击平台后才把完整信息写入剪贴板：

```json
"access": {
  "items": [
    {
      "platform": "github",
      "label": "GitHub",
      "description": "复制 GitHub 链接",
      "value": "https://github.com/..."
    },
    {
      "platform": "bilibili",
      "label": "哔哩哔哩",
      "description": "复制视频链接",
      "value": "https://www.bilibili.com/video/BV..."
    }
  ],
  "note": "复制后请手动前往对应平台使用。"
}
```

`platform` 仅支持已经配有本地 Logo 的 `bilibili`、`xiaohongshu`、`douyin`、`kdocs`、`qq` 和 `github`。不再提供通用“网址”平台；增加新平台时，必须同时在 `assets/platforms/` 放置同名 SVG 并登记前端元数据。需要展示但暂时不可复制的信息，可以增加 `"copyable": false`。复制后由用户自行打开对应平台并完成后续操作。

案例封面全部使用静态 WebP。本站只负责展示、搜索、分类和外链引流，不承担支付、下载、授权或售后逻辑。

## 本地预览

必须通过 HTTP 服务预览，不能直接双击 `index.html`，否则浏览器可能阻止读取 JSON。

```sh
python3 -m http.server 4173
```

然后访问 `http://127.0.0.1:4173/`。
