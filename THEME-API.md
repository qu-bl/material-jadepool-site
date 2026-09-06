# 应用主题接口 v1

网页在 head 中同步加载本地 `theme.js`（已包含 Google Material Color Utilities 0.4.0，无 CDN 请求）。API 只更新网页外观，不涉及执行宿主代码。宿主应在当前主页面内通过 WebView 的 JavaScript 执行接口调用；不要拼接未经序列化的数据。网页没有监听不受限制的跨域 postMessage。

## 最简调用

```js
window.setAppTheme({
  mode: 'dark',           // light / dark / system
  colorMode: 'seed',      // default / seed / custom
  seedColor: '#6750A4'    // 六位不透明 RGB；不是 ARGB
});
```

- `mode` 是独立的深浅模式设置，`system` 跟随网页环境的 prefers-color-scheme。
- `default` 使用本站蓝色种子；`seed` 使用应用的 seedColor，由官方 SchemeVibrant 算法生成配色。种子色不是最终按钮色。
- `custom` 精确应用宿主提供的深浅色板。宿主负责自定义颜色的可读性。
- 仅提交需要更新的字段，其余设置保留。`palettes` 字段整体替换，不做深层合并。
- 数据只在本次页面生命周期保存，重新加载后宿主应重新传入；不把上一个宿主的颜色存入浏览器。

## 独立接口

```js
QianjiTheme.setMode('light');
QianjiTheme.setMode('dark');
QianjiTheme.setMode('system');
QianjiTheme.setSeedColor('#008577'); // 同时切换到 seed 模式
QianjiTheme.setColorMode('default');
QianjiTheme.setColorMode('seed');
QianjiTheme.getTheme(); // 返回设置、resolvedMode 和当前完整 colors 的副本
QianjiTheme.reset();    // 恢复跟随系统 + 默认蓝色
```

网页不提供手动切换入口，独立打开默认跟随系统；宿主仍可通过接口设置外观。显式 light/dark 不受系统后续切换影响。

## 完整应用色板

```js
QianjiTheme.setPalettes({
  light: {
    primary: '#6750A4', onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF', onPrimaryContainer: '#21005D',
    surface: '#FFFBFE', onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F', surfaceContainer: '#F3EDF7',
    outline: '#79747E'
  },
  dark: {
    primary: '#D0BCFF', onPrimary: '#381E72',
    primaryContainer: '#4F378B', onPrimaryContainer: '#EADDFF',
    surface: '#141218', onSurface: '#E6E1E5',
    onSurfaceVariant: '#CAC4D0', surfaceContainer: '#211F26',
    outline: '#938F99'
  }
}); // 同时切换到 custom 模式，深浅模式保持原设置
```

light 与 dark 必须同时提供，每套至少包含示例中的九个角色。缺少的 surfaceContainerLow / High / Highest 会沿用 surfaceContainer；outlineVariant 沿用 outline；inverseSurface / inverseOnSurface 分别沿用 onSurface / surface。

可选角色：`secondary`、`onSecondary`、`secondaryContainer`、`onSecondaryContainer`、`tertiary`、`onTertiary`、`surfaceContainerLow`、`surfaceContainerHigh`、`surfaceContainerHighest`、`outlineVariant`、`inverseSurface`、`inverseOnSurface`、`error`、`onError`。其余缺省角色由种子色补全。

所有颜色必须使用 `#RRGGBB`。未知字段、不合法模式或颜色、缺失必要色板会抛出 TypeError；整次更新不会生效，原主题保留。设置接口返回应用后的主题快照。

## 加载时机

最简单是在 WebView 页面加载完成回调中调用 `window.setAppTheme(...)`。若支持 document-start 注入，可提前写入：

```js
window.__APP_THEME__ = { mode: 'dark', colorMode: 'seed', seedColor: '#6750A4' };
```

网页主题脚本初始化时会读取它，减少首屏主题闪烁。只给 __APP_THEME__ 赋新值不会更新已加载页面；后续更新调用 setAppTheme。

也可在初始化前注册就绪事件，并对已经就绪的情况立即同步：

```js
function syncTheme() {
  window.setAppTheme({mode: 'dark', colorMode: 'seed', seedColor: '#008577'});
}
if (window.QianjiTheme) syncTheme();
else window.addEventListener('qianji:themeready', syncTheme, {once: true});
window.addEventListener('qianji:themechange', event => {
  // event.detail 包含 resolvedMode 和 colors。
  // 不要在此无条件再次 setTheme，以免形成循环。
});
```

24 小时主题逻辑可由应用定时调用 setSeedColor 或 setTheme 更新。网页不会启动另一个定时调色器覆盖应用设置。

## CSS 与构建

所有界面颜色通过 `--md-sys-color-*` 语义变量应用；图片和平台图标素材保留原色。浏览器 theme-color 和原生表单控件 color-scheme 同步更新。

源码 `src/theme.js`，官方依赖 `vendor/material-color-utilities/`（Apache-2.0），部署文件 `theme.js`。修改源码后重新生成本地 bundle：

```sh
npx --yes esbuild@0.25.10 src/theme.js --bundle --minify --format=iife --target=es2020 --outfile=theme.js
node tools/test_theme.cjs
python3 tools/validate_site.py
```

这里已完成网页端接收接口；Android、鸿蒙、Apple 宿主 WebView 的注入接线须由各应用在对应页面加载后调用上述 API。

## 顶部安全区域

页面已移除顶部品牌栏。内容顶部预留 64px，并额外保留 `env(safe-area-inset-top)` 安全区避让；应用 WebView 可通过根元素 CSS 变量 `--app-safe-area-top` 提供额外避让高度（例如 `80px`）。页面取两者较大值，避免重复累加。
