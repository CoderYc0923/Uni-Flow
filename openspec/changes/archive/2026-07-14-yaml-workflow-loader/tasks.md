## 1. Schema 与依赖

- [x] 1.1 添加依赖：`yaml`、`ajv`（及必要时 `@types`）
- [x] 1.2 编写 `schemas/uniflow.workflow.schema.json`（apiVersion/kind/metadata/spec.units/flow/policy/entry）
- [x] 1.3 用若干 valid/invalid 样例手测或单测锁定 Schema 边界

## 2. YAML Loader

- [x] 2.1 新增 `src/yaml/`：parse、schema validate、错误格式化
- [x] 2.2 实现 builtin registry（至少 `builtin.mock`；可选最小 `builtin.http`）
- [x] 2.3 实现 `uses` 解析：registry + builtin；缺失则 load-time 失败
- [x] 2.4 实现 flow 映射：sequential / parallel / router / loop / dag / delegation → 现有 ControlFlow
- [x] 2.5 实现 `spec.policy` / unit `policyOverrides` / `contextPolicy` 透传
- [x] 2.6 导出 `createEngineFromYaml`（及必要类型）于 `src/index.ts`

## 3. Validate CLI

- [x] 3.1 实现 CLI 入口与 `validate <path>`（schema only，exit 0/非 0）
- [x] 3.2 配置 package.json `bin.uniflow` 与 build 产物路径
- [x] 3.3 补充 CLI / validate 单测或脚本冒烟

## 4. 约定与模板

- [x] 4.1 新增 `.cursor/rules/uni-flow.mdc`（四条编排纪律）
- [x] 4.2 新增或更新 `AGENTS.md`，指向 Schema、validate、templates
- [x] 4.3 新增 `examples/templates/`：qa、rag、vertical-transaction、media-pipeline
- [x] 4.4 新增可运行 YAML 示例 + 加载运行测试（builtin.mock）

## 5. 文档与回归

- [x] 5.1 更新 README：P0 YAML 落地说明、`createEngineFromYaml` / `uniflow validate` 用法
- [x] 5.2 运行 `npm test` 与 `npm run typecheck`，确认通过
