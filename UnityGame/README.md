# Unity 工程

这个目录是 Unity 版工程。用 Unity Hub 打开 `UnityGame` 即可。

当前导入内容：

- `Assets/ImportedPrototype/src`：原 HTML/JS 游戏逻辑。
- `Assets/ImportedPrototype/assets`：原像素素材。
- `Assets/ImportedPrototype/index.html`、`styles.css`、`desktop`、`package*.json`：原 Electron 原型文件。
- `Assets/ImportedPrototype/preview*.png`：当前预览图。

说明：`node_modules`、Electron 构建产物和 Unity 的 `Library/Temp/Logs` 没有提交，它们都是可重新生成的依赖或缓存。后续可以在 Unity 里逐步把 `ImportedPrototype` 里的地图、剧情和素材迁成原生 Unity 场景、Tilemap、ScriptableObject 和 C# 逻辑。

当前 Unity 原型主线已包含：旧教堂序章、第一章城市买生活用品、回光明大学寝室，以及进入寝室后手机响起，室友张超来电通知学校组织去城南旧鬼屋活动的任务。鬼屋集合细节仍是后续待定内容。
