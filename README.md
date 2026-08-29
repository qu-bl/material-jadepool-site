# 千机百变应用内官网

纯静态 GitHub Pages 项目，用作 RiveLab 内置 WebView 的官方展示与设计伙伴案例页面。

## 内容结构

- `index.html`：官方介绍、活动轮播、基本信息和伙伴案例库
- `guide/index.html`：制作指南与设计伙伴招募
- `data/activities.json`：官方活动 Banner 数据
- `data/cases.json`：伙伴案例卡片数据
- `assets/activities/`：活动 WebP 海报
- `assets/cases/`：伙伴案例 WebP 封面

## 新增官方活动

1. 将活动 WebP 放入 `assets/activities/`。
2. 在 `data/activities.json` 增加一条记录。
3. `url` 可以是同域页面、外部网页或 `mailto:` 链接。

“制作指南与伙伴招募”作为长期官方活动保留在轮播中，并链接到 `./guide/`。

## 新增伙伴案例

1. 将 16:10 WebP 封面放入 `assets/cases/`。
2. 在 `data/cases.json` 增加一条记录。
3. 填写名称、伙伴、分类、平台、标签和唯一主外链。
4. 使用 `featured` 控制精选标识，使用 `visible` 临时隐藏失效案例。

本站只负责展示、搜索、分类和外链引流，不承担支付、下载、授权或售后逻辑。

## 本地预览

必须通过 HTTP 服务预览，不能直接双击 `index.html`，否则浏览器可能阻止读取 JSON。

```sh
python3 -m http.server 4173
```

然后访问 `http://127.0.0.1:4173/`。
