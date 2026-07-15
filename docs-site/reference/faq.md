# FAQ

**没有 API Key 能跑吗？**  
能，用 `createMockAdapter`。

**和 LangGraph / 自研 Kernel 什么关系？**  
互补。外层标准化编排用 Uni-Flow；箱内可继续 LangChain/Kernel。推荐 Unit Wrapper，而不是推倒重来。

**YAML 现在能跑吗？**  
能。`createEngineFromYaml` + `uniflow validate`；见 [YAML 编排](../orchestration/yaml.md) 与 `examples/yaml-sequential.yaml`。

**AI 改代码如何遵守标准？**  
遵循 `.cursor/rules/uni-flow.mdc` / `AGENTS.md`：拓扑改 YAML、能力加 `uses`、改完跑 validate。见 [Agent 约定](agents.md)。

**HITL？**  
引擎发 `hitl-request` 并暂停；业务调 resume / HITL API。

**文档站如何本地预览？**  

```bash
pip install -r requirements-docs.txt
mkdocs serve
```

**Pages 部署要改什么？**  
见 [GitHub Pages 部署](../ops/github-pages.md)：Settings → Pages → Source = GitHub Actions，并更新 `mkdocs.yml` 的 `site_url`。
