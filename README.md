# 千机百变应用内官网

纯静态 GitHub Pages 项目，用作 RiveLab 内置 WebView 的官方展示，以及“官方与伙伴们的创意橱柜”。

## 内容结构

- `index.html`：包含面向五类主题的插画 Banner 轮播和创意橱柜
- `data/activities.json`：官方活动 Banner 数据
- `data/cases.json`：官方与伙伴案例卡片数据
- `assets/activities/`：活动 WebP 海报
- `assets/cases/`：伙伴案例 WebP 封面
- `assets/platforms/`：弹窗内使用的平台 SVG Logo
- `assets/favicon.svg`：用户提供的章鱼 Logo，白色背景

## 新增官方活动

1. 将活动 WebP 放入 `assets/activities/`。
2. 在 `data/activities.json` 增加一条记录。
3. 需要用户获取信息时，配置与案例相同的 `access.items`。

首页的五个主题为：发现创意、设计定制、异形屏幕、学习创作、趣味工具。每张 Banner 使用独立的 Google 式几何插画，文案由页面渲染，不嵌在配图中。默认每 7 秒自动切换；移动端支持滑动切换。平台筛选展开为竖列图标，与分类保持同一行。

Banner 可使用 `action: "showcase"` 跳到案例区，配合 `category` 筛选已有分类。其他 Banner 使用 `access.items` 展示联系信息。定制与异形屏幕咨询沿用官方创作者 QQ 群；制作指南正式链接待发布，弹窗中保留状态并提供交流群入口。

## 新增创意案例

1. 将 16:10 WebP 封面放入 `assets/cases/`。
2. 在 `data/cases.json` 增加一条记录。
3. 填写名称、作者、分类、运行平台、标签和 `access.items`；官方案例将作者写为“千机百变官方”。
4. 页面会根据当前结果顺序自动组合大卡、标准卡和宽卡；将重点案例放在数据前部即可。
5. 使用 `visible` 临时隐藏失效案例。

平台仅使用 `Apple`、`Android` 和 `HarmonyOS` 三个数据值，页面会自动显示为对应图标。

所有案例和官方活动共用同一套获取信息弹窗。弹窗只显示具体平台的 Logo 和提示，网址直接跳转，QQ 等文字内容点击后写入剪贴板：

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

`platform` 仅支持已经配有本地 Logo 的 `bilibili`、`xiaohongshu`、`douyin`、`kdocs`、`qq` 和 `github`。不再提供通用“网址”平台；增加新平台时，必须同时在 `assets/platforms/` 放置同名 SVG 并登记前端元数据。需要展示但暂时不可复制的信息，可以增加 `"copyable": false`。非网址内容保留复制交互。

案例封面全部使用静态 WebP。本站只负责展示、搜索、分类和外链引流，不承担支付、下载、授权或售后逻辑。

## 本地预览

必须通过 HTTP 服务预览，不能直接双击 `index.html`，否则浏览器可能阻止读取 JSON。

```sh
python3 -m http.server 4173
```

然后访问 `http://127.0.0.1:4173/`。

## 主题与应用接入

整页使用 Material 语义配色，支持跟随系统、浅色、深色，以及默认、种子色、自定义色板。宿主接入说明及示例见 [THEME-API.md](./THEME-API.md)。

## 展开信息卡片（视频 → 全文简介 → 平台入口）

案例或 Banner 可增加 `description` 保存完整简介（支持换行，不截断），以及 `video`：

```json
"video": { "platform": "bilibili", "id": "真实BV号", "aspectRatio": 1.7777777778 }
```

`platform` 支持 bilibili、douyin、youtube；id 分别为 BV 号、抖音视频数字 ID、YouTube 视频 ID。竖屏使用 aspectRatio: 0.5625。必须配置真实、允许嵌入的视频，不能填普通分享短链。无有效视频时显示案例封面；有视频时点击“播放视频”才加载官方播放器，关闭卡片即移除播放器。视频平台的原页链接自动加入底部入口。

access.items 中的 `url` 或 `value` 为完整 HTTP(S) 网址时，新窗口打开原页。QQ 或显式 `action: "copy"` 仍复制内容。普通非网址文本默认复制，`copyable: false`、待发布和样例内容禁用。平台图标保留独立标识及颜色。

数据验证：`node tools/test_media.cjs`。实际视频的播放效果仍需使用正式链接在宿主 WebView 中验证。

`assets/brand-logo.svg` 为网站品牌 Logo，源自用户提供的 `0 2.svg`，仅增加白色底。系统筛选的苹果、安卓、鸿蒙标识，以及外链平台图标保持各自独立，不替换成品牌 Logo。
