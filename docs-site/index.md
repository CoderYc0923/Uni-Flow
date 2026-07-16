# Uni-Flow

**编排多个 Agent 的引擎**——拓扑写 YAML，领域能力用插件接入。不替代你的大模型，也不吞掉业务规则。

## 一句话痛点

做一个「记账 + 闲聊」助手时：用户说「午饭 32」要记账，说「今天天气怎么样」要闲聊。若塞进一个大 Prompt，或到处手写 `if/else` 调 Agent，很快就会乱、难测、难加规则。

Uni-Flow 要你做的是：

```text
用户话 → Router（判意图）→ record 记账 Unit | general 闲聊 Unit
```

顺序、分支、预算写在配置里；真正记账/闲聊的逻辑仍是你的插件。

<div class="uf-cta" markdown="0">
  <a href="understand/what-it-solves/">先懂它：它解决什么</a>
  <a class="uf-cta--ghost" href="hands-on/mock-minimal/">动手：最小可跑</a>
</div>

## 接下来读什么

| 路径 | 你会得到 |
|------|----------|
| [它解决什么](understand/what-it-solves.md) | 记账故事：乱法 vs 清法 |
| [核心公式](understand/core-formula.md) | Unit / ControlFlow / 管线各一句 |
| [是不是空壳？](understand/empty-shell.md) | 设计意图 vs 仓库里真能跑什么 |
| [最小可跑](hands-on/mock-minimal.md) | 无 API Key 的 Mock 示例 |

本地预览本站：`pip install -r requirements-docs.txt && mkdocs serve`
