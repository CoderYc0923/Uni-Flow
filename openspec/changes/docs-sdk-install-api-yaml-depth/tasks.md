## 1. API inventory and handbook gaps

- [ ] 1.1 对照 `server.ts` 与 `src/index.ts` 导出，起草公开 API 清单（HTTP / TS 进程内 / Py·Java SDK）
- [ ] 1.2 新增或强化 `docs-web/reference/` 清单页：每项「用途一句话 + 链接」；总览页链到清单
- [ ] 1.3 为缺失手册的公开表面补最小页或 TypeDoc 链 + 用途；抽查现有 HTTP/SDK 页含用途段

## 2. Multilang install and packaging

- [ ] 2.1 重写 `guide/install.md`：TS npm、Python pip、Java Maven/Gradle；标注「目标命令 vs 今日可用路径」
- [ ] 2.2 为 `sdk/java` 添加 `pom.xml`（最小 jar）并文档化 `mvn install` 本地坐标
- [ ] 2.3 对齐 `sdk/python/README.md`、Java README（新建）、必要时根 README 安装入口
- [ ] 2.4 指南增加三语言「第一行调用」片段；`guide/cross-project`（或 cross-lang）写清 TS 父 + Java 子 `/execute` 路径并链 demo

## 3. YAML field reference and validate

- [ ] 3.1 新增或大幅扩展 YAML 字段参考页：对照 Schema 注解 metadata / units / policy / 各 flow.type
- [ ] 3.2 写清 `uniflow validate` 原理：Ajv + Schema；校验范围 vs 不校验（uses / 执行）
- [ ] 3.3 提供带注解的完整 YAML 示例；更新 nav/sidebar 链到新页

## 4. Verification

- [ ] 4.1 `npm run docs:build` 通过；抽查清单 / 安装 / YAML 字段 / 跨项目链接
- [ ] 4.2（可选）`mvn -f sdk/java package` 或 `install` 冒烟通过
