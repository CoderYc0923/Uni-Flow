import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'Uni-Flow',
    description: 'Agent 统一编排标准库',
    lang: 'zh-CN',
    base: '/Uni-Flow/',
    cleanUrls: true,
    lastUpdated: true,
    appearance: true,
    themeConfig: {
      logo: undefined,
      nav: [
        { text: '为什么选', link: '/why/three-w' },
        { text: '原理', link: '/architecture/model' },
        { text: '指南', link: '/guide/quickstart' },
        { text: '示例', link: '/examples/' },
        { text: 'API', link: '/reference/' },
        { text: '贡献', link: '/contribute' },
        {
          text: 'GitHub',
          link: 'https://github.com/CoderYc0923/Uni-Flow',
        },
      ],
      sidebar: {
        '/why/': [
          {
            text: '为什么选 Uni-Flow',
            items: [
              { text: '诉求与 3W', link: '/why/three-w' },
              { text: '与成熟框架对比', link: '/why/vs-frameworks' },
              { text: '模式变动抗性', link: '/why/resilience' },
            ],
          },
        ],
        '/architecture/': [
          {
            text: '原理与规划',
            items: [
              { text: '两层模型', link: '/architecture/model' },
              { text: '执行管线与 Layer4', link: '/architecture/pipeline' },
              { text: '模块地图', link: '/architecture/modules/' },
              { text: '路线图', link: '/architecture/roadmap' },
              { text: '设计长文附录', link: '/architecture/design-appendix' },
              { text: '设计长文全文', link: '/architecture/design-longform' },
            ],
          },
          {
            text: '模块 3W',
            collapsed: false,
            items: [
              { text: 'WorkflowUnit', link: '/architecture/modules/workflow-unit' },
              { text: 'RuntimeAdapter', link: '/architecture/modules/runtime-adapter' },
              { text: 'ControlFlow', link: '/architecture/modules/control-flow' },
              { text: 'SharedState', link: '/architecture/modules/shared-state' },
              { text: 'MessageBus', link: '/architecture/modules/message-bus' },
              { text: 'Engine', link: '/architecture/modules/engine' },
              { text: 'Layer4 组件', link: '/architecture/modules/layer4' },
              { text: 'YAML Loader', link: '/architecture/modules/yaml-loader' },
              { text: 'Orchestrator', link: '/architecture/modules/orchestrator' },
              { text: 'SDK 与 CLI', link: '/architecture/modules/sdk-cli' },
            ],
          },
        ],
        '/guide/': [
          {
            text: '指南',
            items: [
              { text: '安装', link: '/guide/install' },
              { text: '快速开始', link: '/guide/quickstart' },
              { text: 'YAML 与 validate', link: '/guide/yaml' },
              { text: 'uses 与插件', link: '/guide/uses' },
              { text: '跨语言', link: '/guide/cross-lang' },
            ],
          },
        ],
        '/examples/': [
          {
            text: '示例',
            items: [
              { text: '索引', link: '/examples/' },
              { text: '记账意图分流', link: '/examples/accounting-router' },
              { text: 'Sequential', link: '/examples/sequential' },
              { text: '跨语言', link: '/examples/cross-lang' },
            ],
          },
        ],
        '/reference/': [
          {
            text: 'API 参考',
            items: [
              { text: '总览', link: '/reference/' },
              { text: 'Orchestrator HTTP', link: '/reference/http/' },
              { text: 'TypeScript SDK', link: '/reference/typescript-sdk' },
              { text: 'Python SDK', link: '/reference/python-sdk' },
              { text: 'Java SDK', link: '/reference/java-sdk' },
              { text: 'Engine', link: '/reference/engine' },
              { text: 'YAML API', link: '/reference/yaml-api' },
              { text: 'ControlFlow', link: '/reference/controlflow' },
              { text: 'Adapters', link: '/reference/adapters' },
              { text: 'Layer4', link: '/reference/layer4' },
              { text: '生成附录 (TypeDoc)', link: '/reference/generated/' },
            ],
          },
          {
            text: 'HTTP 路由',
            collapsed: true,
            items: [
              { text: 'GET /health', link: '/reference/http/health' },
              { text: 'GET /workflows', link: '/reference/http/workflows' },
              { text: 'POST /workflows/from-yaml', link: '/reference/http/from-yaml' },
              { text: 'POST .../runs', link: '/reference/http/start-run' },
              { text: 'GET .../runs/:runId', link: '/reference/http/get-run' },
              { text: 'POST .../resume', link: '/reference/http/resume' },
              { text: 'POST .../hitl', link: '/reference/http/hitl' },
              { text: 'GET /memory/search', link: '/reference/http/memory-search' },
              { text: 'POST /mcp', link: '/reference/http/mcp' },
            ],
          },
        ],
      },
      socialLinks: [
        { icon: 'github', link: 'https://github.com/CoderYc0923/Uni-Flow' },
      ],
      search: { provider: 'local' },
      outline: { level: [2, 3] },
      footer: {
        message: 'MIT Licensed',
        copyright: 'Uni-Flow',
      },
    },
    mermaid: {},
  }),
)
