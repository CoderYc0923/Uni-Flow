# FAQ

**没有 API Key 能跑吗？**  
能，用 Mock。见 [最小可跑](../hands-on/mock-minimal.md)。

**Uni-Flow 是不是空壳？**  
编排与校验是实的；记账等业务插件要你自己挂。见 [是不是空壳？](../understand/empty-shell.md)。

**和 LangGraph / 自研 Kernel 什么关系？**  
互补。外层编排用 Uni-Flow；箱内可继续 LangChain/Kernel。推荐 Unit Wrapper。

**YAML 现在能跑吗？**  
能。`createEngineFromYaml` + `uniflow validate`；见 `examples/accounting-router.yaml`。

**AI 改代码如何遵守标准？**  
[`AGENTS.md`](https://github.com/CoderYc0923/Uni-Flow/blob/main/AGENTS.md) 与 `.cursor/rules/uni-flow.mdc`。

**HITL？**  
引擎发 `hitl-request` 并暂停；业务调 resume / HITL API。

**文档站本地预览？**

```bash
pip install -r requirements-docs.txt
mkdocs serve
```
