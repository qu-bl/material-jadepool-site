# 资源包制作台规范（与应用脚本分开）

当前可修改 resource-package.json 和 main.js，响应字段分别为 manifestJson、mainJavaScript。两者是一份契约：只改行为可以只返回 JS；新增字段/UI/权限/绑定时同步修改 JSON；只返回确实变动的完整文件。不能返回 applicationJavaScript。

## 文件与清单

- 归档根目录为 resource-package.json、main.riv、preview.webp；有脚本时为 main.js；其他素材在 assets/，用户产生的耐久数据在本包 data/。不要在归档根再包一层目录。
- JSON 顶层必填 schemaVersion:3、id、version、name、author、preview、rive、values、capabilities、bindings、assets、ui。description、$schema、javascript 可选；无真实 Schema 地址就省略 $schema。不添加未定义的键。
- id 使用稳定小写反向域名（允许数字/连字符），version 为 SemVer；name/author 非空；preview 固定 preview.webp；values/bindings/ui 是数组，capabilities 是 {observe:[],trigger:[]}，assets 是 {audio:[]}，空内容也保留对应结构。
- javascript 若存在必须为 {entry:"main.js",networkDomains:[]}，且 main.js 文件存在。networkDomains 只放实际用到的纯域名，不含协议、路径、端口或 *；域名规则也应用于 WebSocket 和重定向目标。
- rive 为 {file:"main.riv",artboard,stateMachine,viewModel?,instance?,layout:{fit,alignment,layoutScaleFactor?}}。artboard/stateMachine 非空，viewModel/instance 同时声明或同时省略，有 bindings 时两者必需。
- fit 可为 contain/cover/fill/fitWidth/fitHeight/none/scaleDown/layout；alignment 可为 center/topLeft/topCenter/topRight/centerLeft/centerRight/bottomLeft/bottomCenter/bottomRight。layoutScaleFactor 位于 layout 内，若设置必须是有限正数，仅用于 Fit.layout。
- Rive 画板、状态机、View Model、实例和属性必须使用真实名称。当前 JSON 已有配置在无证据否定时保留；缺少新增绑定的资产信息就询问，不能凭空生成“默认名称”或把 QVMI 当成 RVMI。
- 已确认存在的资产可以引用；不能假装通过修改 JSON/JS 创建了未提供的 main.riv、图片、字体或音频。

## JS 入口和权限

调用一次 defineResourcePackage({activate(qu){},deactivate(){}})，两个回调必需。activate 在该资源包运行实例激活时调用，可返回 Promise，但宿主启动等待约 10 秒，不在其中无限等待 UI。deactivate 同步清理观察/socket与停止标记；宿主会回收会话网络任务。没有应用脚本的 @interval/@observe/onStart/onInterval 元数据调度；定时需求可观察已声明的 system.time.epochMs，并在回调按业务频率筛选，不调用未开放的 setInterval。

- 包有自己的 QVMI 实例，可读自有声明字段和自动生成的 UI 字段。不能调用 viewModel.define；所有 package.* 字段在 JSON 载入时就应存在。
- 读取/订阅公共字段需在 capabilities.observe 声明完整路径；一般权限允许尾部 .*，但绑定来源校验要求 observe 中精确列出其路径，生成时优先明确逐项声明。
- JS 只可写 values 声明的可写包字段。UI 字段由宿主组件拥有，即使内部可写，也不允许 JS 直接赋值；JS 只能读取/订阅后写自己的输出字段。
- 不能写 app.theme.brand 或任意全局 app.*；可以按 observe 授权读取全局已存在字段。应用脚本创建字段的权限不属于资源包；缺失字段不能用 define 补救。
- 宿主动作需在 capabilities.trigger 授权，必须为 runtime.*；网络只走 qu.network，存储只走 qu.persistence，不使用 runtime.network/runtime.storage。
- 当前实现使用任意 runtime.log.* 时还需包含 runtime.log.info，以满足日志能力总开关；并声明实际调用的 warn/error 路径。原生日志不代替实际 QVMI 输出。

## 自有字段及输出

values 每项为 {path,type,writable,persistent,defaultValue?}。
- path 形如 package.output.score，段内使用英文字母/数字，不用下划线/连字符；path 不得重复。
- type 为 number/string/boolean/color/trigger/enum/resource/image/artboard/list/viewModel。清单没有 json/object/binary 自有类型；不要混用应用 define 的类型集合。列表通过 qu.viewModel.json(path) 读写；脚本没有 artboard()/viewModel() 属性入口。
- defaultValue 仅在确有初始化值时提供；未填表示字段占位，不等于已发布。用与声明类型一致的值：number/boolean/string、颜色字符串、资源引用或字符串列表。
- persistent:true 仅允许 writable:true 的 package.storage.*，类型限 number/string/boolean/color/enum/resource/image/list。trigger 无耐久状态，不持久化。
- .value = result 写入已有包字段即发布结果，无需重建绑定、调用刷新或写磁盘。已有本地普通值同值赋值不通知；trigger 每次发布为事件。
- 当前包脚本没有直接发布自有 trigger 的公开方法；qu.viewModel.trigger(path).fire(payload) 只调宿主动作。包 trigger 可由 RVMI 的 fromRive 绑定或原生 action UI 发布，再由脚本 observe；不能用数字冒充 trigger 类型或借用应用 define 绕过限制。请求超出此边界时明确说明，不伪造 API。

## QVMI ↔ RVMI

bindings 每项完整形如：
{"id":"score","qu":"package.output.score","quType":"number","rive":["Score"],"riveType":"number","direction":"toRive","mode":"latest","required":true}

这是结构说明，不证明资产存在 Score。生成时逐字替换为已知真实路径。
- qu 指向 values/UI 字段，或在 capabilities.observe 精确声明的公共来源；quType 必须匹配来源类型。
- rive 是真实属性路径数组，嵌套属性逐段写；不是画板名称数组。riveType 为 number/string/boolean/color/trigger/enum/image/artboard/list/viewModel。
- direction 为 toRive/fromRive/twoWay，mode 固定 latest；required 为 boolean，真正必须存在的绑定才设 true。fromRive/twoWay 目标只能是 writable 包字段，不能写系统数据。
- 一般类型对应；resource → image 是文件解码特例，只支持 toRive；object 来源可按实际对象类型解析。image/artboard/list/viewModel 仅 toRive，trigger 不允许 twoWay。图像/图结构能力是否有对应资产，仍需实际 Rive 文件支持。
- 结构值约定：image 使用可解析资源引用；artboard 使用真实画板名；viewModel 使用 {viewModel:真实名称,source:"named"/"default"/"blank",instance?:实例名}，named 时 instance 必需；Rive list 使用这些实例描述的数组。普通字符串多选列表不能直接当作 Rive 实例列表。JSON 类型的全局输出可声明 quType:object 进入结构化绑定，但不能将不存在的包 JS 类型入口写进脚本。
- 可选 transform 仅限 number → number 的 toRive，字段为 scale、offset、invert、clamp:[min,max]；顺序为 value * scale + offset，再按 invert 取负，再 clamp。不需要变换就省略，不额外造 JS 转发。
- 常见路径：UI/数据源 → QVMI → JS 计算 → package.output.* → manifest binding → RVMI；简单映射也可直接绑定，不强制经过 JS。

## 实例触摸（仅运行画面）

| 路径 | 入口 | 值 |
| --- | --- | --- |
| device.touch.x | number | 画面内归一化横坐标，通常 0..1 |
| device.touch.y | number | 画面内归一化纵坐标，通常 0..1 |
| device.touch.isDown | boolean | 是否按下 |
| device.touch.phase | enumeration | down/move/up/cancel；可重复发布同阶段 |
| device.touch.pointerId | number | 当前鸿蒙 QVMI 发布为 0，不是多指数组 |

分别声明 observe。触摸来自当前运行实例，不是全局屏幕；Rive 自身触摸交互走原生 pointer，脚本不应重复发送事件或翻转坐标。取消/离开可能发布 cancel；不要把非按下状态坐标当成持续操作。

## 原生动态 UI

ui 是组数组：{id,title,scope,components}；scope 为 persistent/runtime；组至少一个组件。组 id、组件 id 各自在包内唯一；id 以字母开头，仅字母/数字/连字符，最长 64。
所有组件必填 id、type、label（1–128 字符）、description（1–512 字符）；可选 enabled/visible boolean。除 notice/action 外还必须有 valueType、类型正确的 defaultValue。
- persistent 值组件有非空 propertyPath 数组，例如 ["settings","volume"]；自动生成 package.storage.settings.volume，初次恢复 data/默认值，在内存随 UI 更新，设置关闭后宿主持久化。不必再在 values 重复定义。
- runtime 不得声明 propertyPath；生成 package.ui.<componentId> 占位，无默认发布、无上次运行结果恢复；defaultValue 只作为本轮弹窗初值。JS 不得直接写 UI 字段。
- UI 的 valueType 决定 JS 句柄，如 enum 用 enumeration，list 用 json，filePicker 用 resource。

| type | valueType | 其余必要配置 |
| --- | --- | --- |
| toggle | boolean | 默认 true/false |
| slider | number | 有限 min < max；step > 0 且不超过范围；默认值在范围内 |
| number | number | 有限 min ≤ max、step > 0、placeholder |
| text | string | placeholder、maxLength 整数 1–4096、multiline boolean |
| color | color | 默认 #AARRGGBB |
| singleChoice | string/enum | 非空 options:[{value:string,label:string}]，默认值在选项中 |
| segmented | string/enum | 同 singleChoice |
| multiChoice | list | 字符串数组默认值、非空 options:[{value:string,label:string}]；选项值唯一 |
| filePicker | resource | 默认可为 ""；acceptedFileExtensions 如 [".json",".png",".mp3"]（带点、不重复）、maxBytes 正安全整数 |
| resourceChoice | resource | 非空 options:[{resource:"assets/...",label:string}]，文件真实存在，默认值等于某项 resource；不限图片 |
| action | 不声明 | 仅 runtime；text 非空且最多 64 字符；不带 defaultValue/propertyPath；结果是 trigger |
| notice | 不声明 | 仅 persistent；text 非空；不带 defaultValue/propertyPath；不产出 QVMI |

qu.viewModel.openUi(componentId) 返回 Promise<true>，**仅表示显示请求已提交，不表示用户确认**。必须在可显示 UI 的运行场景中调用；当前一次显示一个已声明组件，新请求替换旧请求，不支持一次传数组或整个组。
先订阅 package.ui.<componentId> 再调用 openUi；用户确认才发布结果，取消不发布也不持久化。观察可能先补发本次运行中之前的结果；openUi 完成后也不能直接把 .value 当新确认。当前没有向 JS 发布的独立取消结果或请求编号，普通值再次确认同值也可能不通知，不要承诺精确逐轮确认/取消握手；需要此语义时如实说明当前限制。
文件选择先暂存，确认后放入本包 data/ui-files 并发布相对引用，取消清理暂存。宿主负责控件、生命周期和持久化，JSON 不声明外观样式，不自造手势流程。

## 包文件、持久化与直接 Rive 控制

| API | 参数/同步结果 |
| --- | --- |
| qu.resources.token(resourceId) | 已登记包资源 ID（通常 assets/...）→ qjres://... token；不存在抛错，不自行拼接 |
| qu.resources.readText(reference) | 包相对路径或有效 token → UTF-8 string，最多 8 MiB |
| qu.resources.readJson(reference) | 同 readText 后 JSON.parse → JSON 值，解析失败抛错 |
| qu.resources.readBinary(reference) | 包相对路径或有效 token → Uint8Array，最多 32 MiB |
| qu.persistence.save() | 请求保存清单中的 persistent 状态；同步返回 true 不等于云端同步完成 |
| qu.persistence.restore() | 从持久化恢复声明状态到内存；不在高频循环调用 |
| qu.rive.state() | 同步快照，字段见下 |
| qu.rive.load(options) | 同步更新当前画布图选择并返回快照；options 为 artboard、stateMachine、viewModel、instanceKind、instance |
| qu.rive.font(propertyPath).set(resourceId) | 给当前 Rive 字体属性设为真实包字体资源；同步，无返回值 |

资源引用只针对本包 assets/data 或宿主生成的临时 token，不使用绝对路径。没有任意文件写入/列目录/删除/云同步 JS API。将重要结果存到已声明 package.storage.* 后按需 save；UI 字段先复制到自有可写字段再做计算。resource 是文件引用，图像解码由 resource → image 绑定处理；音频使用下述 audio 动作，不把任意文件直接当成图片。

qu.rive.state/load 快照字段：ready、active（boolean），error、file、artboard、stateMachine、viewModel、instanceKind、instance、fit、alignment、frameRate、renderer、runtimeVersion（string），layoutScaleFactor（number）。
load 的 instanceKind 为 none/default/blank/named，默认 none；named 必须配真实 instance。load 不接受文件 URL、fit 或 layoutScaleFactor；布局由 JSON 配置。这里只有 state/load/font.set，不存在脚本 qu.rive.artboard()/viewModel()/number()/play()/pause() 等未暴露接口；值操作通过 QVMI 绑定完成。

## 包音频

assets.audio 项完整为 {id,file,usage,volume,loop}；file 在 assets/，格式 mp3/m4a/aac/wav/ogg/flac；usage 为 effect/music；volume 为 0..1；effect 不允许 loop:true。

| trigger 路径 | payload | 完成语义 |
| --- | --- | --- |
| runtime.audio.play | {audio:音频id,policy:"restart"/"overlap"/"resume",volume?:0..1} | Promise，播放操作成功后完成；不等于整段音频播完 |
| runtime.audio.pause | {audio:音频id} | Promise<true> 表示分发，底层异步失败写日志 |
| runtime.audio.stop | {audio:音频id} | 同上 |
| runtime.audio.setVolume | {audio:音频id,volume:0..1} | Promise<true> |

音频 id 引用 assets.audio.id，不是绝对路径。每个实际使用的动作都需声明 trigger 权限；没有 qu.audio API。日志、提醒、网络参数复用前面的宿主契约，不另造资源包版本。

## 最后核对

JSON 与 JS 的路径、类型、权限、UI id、资产引用、持久字段、绑定两侧真实类型必须一致；清单校验成功不等于 Rive 资产或设备能力已验证。不得输出旧的 manifestVersion、riveBindings、dataLinks、actions、顶层 persistence、Host/data-hub 等结构。产品名称使用千机百变；Qu/QVMI 仅为内部技术名称。
