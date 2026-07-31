# TinyGo WASM 已知问题

## asyncify 函数签名超出浏览器参数上限

### 症状

WASI worker 中加载 TinyGo 编译的 WASM 二进制时，`WebAssembly.compile()` 抛出：

```
Chrome:  CompileError: param count of 1713 exceeds internal limit of 1000
Firefox: CompileError: wasm validation error: at offset 1436: too many arguments in signature
```

### 原因

TinyGo 在 WASM 上实现 goroutine 时使用 LLVM coroutines + asyncify 转换。这个转换会把 goroutine 的所有局部变量"摊平"为函数参数，形成极大的函数签名（实测可达 1425、3505 个参数）。Chrome V8 和 Firefox 都有函数参数上限（通常 1000）。

### 受影响的场景

- 使用了 goroutine 的 TinyGo 程序（如 bubbletea）
- 编译优化级别较低时更容易触发
- 函数内部局部变量多的代码

### 缓解方案

| 方案 | 效果 | 备注 |
|------|------|------|
| `tinygo build -opt=2` | 可能减少参数数量 | 不一定根治 |
| `-scheduler=none` | 完全禁用 goroutine | 不适用于并发程序 |
| 改用 Go 标准编译器 | ✅ **彻底解决** | `GOOS=js GOARCH=wasm`，走 gojs driver |

### 推荐做法

对于使用 goroutine 的程序（bubbletea 等），建议使用 Go 标准编译器编译为 `GOOS=js GOARCH=wasm`，通过 gojs driver 运行。Go runtime 有自己的 goroutine 调度器，不依赖 asyncify，没有参数膨胀问题。

TinyGo 版本适合无 goroutine 或轻量并发的 WASI 程序。
