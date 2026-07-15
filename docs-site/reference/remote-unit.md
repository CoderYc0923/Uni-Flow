# 远程 Unit 契约

完整契约文本保留在仓库（站点不镜像全文）：

**路径：** [`docs/remote-unit-http-contract.md`](https://github.com/OWNER/Uni-Flow/blob/main/docs/remote-unit-http-contract.md)

## 要点摘要

- 远程 Agent / 任意语言实现以 **HTTP Unit** 接入 Orchestrator  
- 通过 `POST /workflows/from-yaml` 提交 `{ yaml, bindings }`  
- `bindings` 将 `uses` 名映射到 `{ type: "http", endpoint }`  
- Orchestrator 注册表为进程内内存：重启后需重新注册  

跨语言跑通步骤见 [跨语言](../orchestration/cross-lang.md) 与 `examples/cross-lang/`。
