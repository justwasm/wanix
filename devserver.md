# Dev Server (COOP/COEP)

启动示例开发服务器：

```sh
cd wanix
go run ./examples/serve.go
```

这会启动两个端口：

- **`:7070`** — 主 HTTP 服务，提供 `wanix/examples/` 下的示例
- **`:7071`** — 与 7070 共用同一个 handler，端口冗余

两个端口都已设置跨域隔离所需的 COOP/COEP 头部：

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

访问示例：`https://<host>:7070/examples/hush/`

### 端口被占用时

```sh
fuser -k 7070/tcp 7071/tcp   # 杀掉占用进程
go run ./examples/serve.go    # 重启
```
