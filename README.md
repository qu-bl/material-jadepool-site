# 千机百变应用内官网

纯静态 GitHub Pages 项目，用作 RiveLab 内置 WebView 的官方展示，以及“官方与伙伴们的创意橱柜”。

## 内容结构

- `index.html`：包含官方介绍的首屏活动轮播和创意橱柜
- `guide/index.html`：制作指南与设计伙伴招募
- `data/activities.json`：官方活动 Banner 数据
- `data/cases.json`：官方与伙伴案例卡片数据
- `assets/activities/`：活动 WebP 海报
- `assets/cases/`：伙伴案例 WebP 封面

## 新增官方活动

1. 将活动 WebP 放入 `assets/activities/`。
2. 在 `data/activities.json` 增加一条记录。
3. `url` 可以是同域页面、外部网页或 `mailto:` 链接。

“制作指南与伙伴招募”作为长期官方活动保留在轮播中，并链接到 `./guide/`。

## 新增创意案例

1. 将 16:10 WebP 封面放入 `assets/cases/`。
2. 在 `data/cases.json` 增加一条记录。
3. 填写名称、作者、分类、平台、标签和唯一主外链；官方案例将作者写为“千机百变官方”。
4. 页面会根据当前结果顺序自动组合大卡、标准卡和宽卡；将重点案例放在数据前部即可。
5. 使用 `visible` 临时隐藏失效案例。

平台仅使用 `Apple`、`Android` 和 `HarmonyOS` 三个数据值，页面会自动显示为对应图标。

本站只负责展示、搜索、分类和外链引流，不承担支付、下载、授权或售后逻辑。

## 本地预览

必须通过 HTTP 服务预览，不能直接双击 `index.html`，否则浏览器可能阻止读取 JSON。

```sh
python3 -m http.server 4173
```

然后访问 `http://127.0.0.1:4173/`。
