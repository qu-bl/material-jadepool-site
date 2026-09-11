# 应用脚本规范

当前唯一可修改文件为 application.js，响应文件字段为 applicationJavaScript。应用脚本不需要资源包 JSON；不要返回 manifestJson/mainJavaScript，不要声明 package.* 或资源包 capabilities。

## 可以做什么与边界

- 读取/订阅宿主能力表中的全局系统、硬件数据，按变化执行逻辑；按时间定期计算；请求网络、处理流/WebSocket；记录日志、调度系统提醒。
- 创建自有全局 app.* QVMI，发布计算、网络结果供其他脚本或获授权的资源包消费；读写已存在的可写 app.* 字段。
- 内置唯一应用输出是 app.theme.brand，入口 color，已创建、可读写/订阅。写 qu.viewModel.color('app.theme.brand').value = '#FF6699CC' 即更改全局主题；宿主负责应用和持久化。禁止对其调用 define，即使当前值为 undefined；无需主题 API 或自建输出。
- 当前应用脚本没有资源包 Rive 画布、音频会话、资源包文件目录、原生 UI 承载者：qu.rive、runtime.audio.*、qu.resources、openUi 不可在本场景使用。没有跨场景选取某资源包会话的 API，也没有全局触摸捕获；device.touch.* 属于运行画面而非全局输入。
- qu.persistence 在应用会话不保存自建字段。app.* 是应用进程内共享内存，不是持久数据库；同一进程内重载脚本不等于清空这些值，应用重启后需由脚本重新创建/初始化。仅内置品牌色已有宿主持久化消费者。
- 不直接控制其他页面、编辑器、应用文件、云同步、AI 设置或密钥。创建字段只是在 QVMI 发布数据，不会凭空生成原生 UI 或 RVMI 绑定。

## 生命周期与调度

全文件调用一次 defineQuScript({...})，按需提供以下回调；跨回调变量放文件顶层 let/const，不依赖 onStart 局部变量或 this。

| 回调 | 时机 |
| --- | --- |
| onStart(qu) | 脚本启用/源码重载后一次；允许 Promise，但宿主启动等待最多约 10 秒，不能在此无限等待用户或网络 |
| onInterval(qu) | @interval 指定周期；没有配置或为 0 不执行 |
| onValue(path,value,qu) | @observe 声明的精确字段订阅收到值；含已有值补发，不只真实变化 |
| onStop() | 禁用、重载或正常关闭时；同步清理，不能依赖异步收尾必定完成或强杀时必定调用 |

文件头注释元数据：@description 一行说明；@interval 毫秒整数，0 关闭，否则至少 1000；每行 @observe 完整路径可重复声明不同字段，不能写通配符。没有资源包的 activate/deactivate。

onStart 成功后宿主才安装元数据订阅、启动间隔任务，因此不能在 onStart 等待 onValue 解锁。同一字段选择 @observe 或手动 observe 一种即可；宿主管理元数据订阅，手动 observe 返回的取消函数自己在 onStop 调用。
onInterval/onValue 不会等待上一次返回的 Promise，异步任务应自己设置 busy 标记、catch 错误、检查停止标记；它们不是串行任务队列。应用生命周期脚本不等于系统保证永久后台运行，冷启动/恢复应根据真实时间和新样本计算，不能靠 tick 次数当作经过时间。

## 字段使用规则：先复用，按需创建

生成前先按本契约确认每个输入、输出字段的来源与类型，再选择操作：

- 宿主或其他脚本已经提供的字段：用对应类型入口取得句柄，直接读取、订阅或向可写字段赋值；不要重新 define，也不要用 define 探测存在性、作为写入前置步骤或包裹成通用“确保字段存在”函数。
- 本脚本确实需要新增的自有输出：才在 onStart 用 define 声明一次；脚本重载时可再次声明同一个自有字段以复用旧值，不在定时/订阅回调里反复声明。不为已有输出额外创建中转字段。
- 字段存在但值为 undefined 表示尚未发布，不是未创建；输入等待有效值，输出按业务直接赋值。不要因此补声明、换类型或静默切换到自建路径。

const field = qu.viewModel.define(path,type,initialValue,options) 同步返回属性句柄。

- path 必须位于 app.*，推荐 app.<脚本名>.<字段名> 防重名；type 可为 number/boolean/string/color/resource/image/enum/trigger/json/binary（不是 enumeration/list/object）。options 可为 {label:string,description:string}。
- 首次创建采用 initialValue；省略则无初值，读到 undefined。同名同类型会复用当前值，不会每次 define 都重置。类型不同或只读会抛错。
- 返回值有 .path、.type、.created、.occupiedBy（其他占用者数组）、.warning，以及 .value、.observe()。重复声明宿主内置字段也会提示占用，不代表另一个脚本正在运行。自有新字段与其他声明撞名时应明确独立命名或有意共享，不能吞掉警告、宣称自动隔离或保证只有一个写入者。
- 数字、文本、颜色等通过 .value = result 发布；对象/数组用 type json，写整个 JSON 值。发布与订阅解耦，多个消费者可订阅同一字段；未被消费的字段不会自动影响界面。
- type trigger 的 **define 返回句柄** 另有同步 field.fire()，只发布 true，不带 payload、不返回 Promise。它不等同于 qu.viewModel.trigger(path).fire(payload)，后者只分发宿主 runtime.* 动作。自建事件携带数据时用 json 字段 {sequence,data}；sequence 显式递增以区分重复事件。当前 trigger 观察也可能补发上一次 true，不能把首次回放误当新指令。
- 没有公开 delete/undefine API。停止订阅或脚本重载不能被当作物理删除字段。

## 最小通用例：订阅输入 → 计算 → 发布

这是可运行的应用脚本，示范宿主电量映射成自有 QVMI，不是任何任务必须照搬的业务。

~~~javascript
/**
 * @description 将电量发布为 0 到 1 的全局值
 * @interval 0
 * @observe system.battery.level
 */
let output;
defineQuScript({
  onStart(qu) {
    output = qu.viewModel.define('app.batteryRatio.value', 'number', 0,
      { label: '电量比例', description: '当前电量除以 100' });
  },
  onValue(path, value) {
    if (path === 'system.battery.level' && typeof value === 'number' && Number.isFinite(value)) {
      output.value = Math.max(0, Math.min(1, value / 100));
    }
  },
  onStop() { output = undefined; }
});
~~~

此例的 define 仅用于新增的电量比例输出，不能照搬到已注册字段。其他内容按真实类型选择入口；只有需要 UI 显示时才写宿主已接入的字段，或者说明需另有消费者。交付前逐项检查所有 define：必须是本脚本自有字段，重复声明已有宿主字段的代码须改为类型句柄访问；同时核对入口/元数据、完整路径、真实输出、错误处理、异步重入和停止清理。
