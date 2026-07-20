import type { ContextPolicy, PolicyConfig } from '../layer4/types.js';
import type { FailureStrategy, RuntimeAdapter, WorkflowUnit } from '../core/types.js';

/**
 * Workflow YAML 文档的类型化形态（`apiVersion: uniflow/v1`）。
 * 与 `schemas/uniflow.workflow.schema.json` 对齐；通常由 {@link validateWorkflowYamlSource} 产出。
 */
export interface WorkflowYamlDocument {
  /** API 版本，必须为 `uniflow/v1`。 */
  apiVersion: 'uniflow/v1';
  /** 资源种类，固定为 `Workflow`。 */
  kind: 'Workflow';
  /** 工作流元数据。 */
  metadata: {
    /** 工作流稳定 ID，对应引擎的 `workflowId`。 */
    id: string;
    /** 可选人类可读说明。 */
    description?: string;
  };
  /** 拓扑与策略主体。 */
  spec: {
    /** 可选入口提示；多数 flow 类型由 `flow` 自身决定调度。 */
    entry?: string;
    /** 工作流级默认策略（重试、超时、预算等）。 */
    policy?: YamlPolicy;
    /** Unit 列表；每项通过 `uses` 解析插件。 */
    units: YamlUnit[];
    /** ControlFlow 拓扑（sequential / parallel / router / loop / dag / delegation）。 */
    flow: YamlFlow;
  };
}

/**
 * YAML 中声明的单个 Unit：`id` + `uses` 插件名，以及可选配置与策略覆盖。
 */
export interface YamlUnit {
  /** Unit 在工作流内的唯一 ID（写入 `output.<id>` 等状态键）。 */
  id: string;
  /** 插件名，形如 `namespace.name`；需在 builtin 或 `registry` / `bindings` 中可解析。 */
  uses: string;
  /** 传给插件工厂的配置对象（内容由具体插件约定）。 */
  config?: Record<string, unknown>;
  /** 该 Unit 的上下文策略局部覆盖。 */
  contextPolicy?: PartialDeepContextPolicy;
  /** 该 Unit 的策略局部覆盖（重试、超时等）。 */
  policyOverrides?: YamlPolicy;
}

/**
 * YAML 中可写的策略片段；各字段均为对应 `PolicyConfig` 子树的 Partial。
 */
export type YamlPolicy = {
  /** 重试策略局部覆盖。 */
  retry?: Partial<PolicyConfig['retry']>;
  /** 超时策略局部覆盖。 */
  timeout?: Partial<PolicyConfig['timeout']>;
  /** 预算策略局部覆盖。 */
  budget?: Partial<PolicyConfig['budget']>;
  /** 并发策略局部覆盖。 */
  concurrency?: Partial<PolicyConfig['concurrency']>;
  /** 熔断策略局部覆盖。 */
  circuitBreaker?: Partial<PolicyConfig['circuitBreaker']>;
  /** 限流策略局部覆盖。 */
  rateLimit?: Partial<PolicyConfig['rateLimit']>;
};

/**
 * 上下文策略的深层 Partial，用于 YAML `contextPolicy` / Unit 覆盖。
 */
export type PartialDeepContextPolicy = {
  /** 工作记忆局部覆盖。 */
  workingMemory?: Partial<ContextPolicy['workingMemory']>;
  /** 会话记忆局部覆盖。 */
  sessionMemory?: Partial<ContextPolicy['sessionMemory']>;
  /** 长期记忆局部覆盖。 */
  longTermMemory?: Partial<ContextPolicy['longTermMemory']>;
  /** 向量记忆局部覆盖。 */
  vectorMemory?: Partial<ContextPolicy['vectorMemory']>;
  /** 压缩策略；未写则沿用默认。 */
  compaction?: ContextPolicy['compaction'];
};

/**
 * YAML `spec.flow` 联合类型：六种内建 ControlFlow 拓扑之一。
 */
export type YamlFlow =
  | { type: 'sequential'; order?: string[] }
  | {
      type: 'parallel';
      units: string[];
      reducer: string;
      failureStrategy?: FailureStrategy;
    }
  | { type: 'router'; routerUnit: string; routes: Record<string, string> }
  | { type: 'loop'; unit: string; maxIterations?: number; untilStateKey?: string }
  | {
      type: 'dag';
      planner: string;
      aggregator: string;
      executors: string[];
      dependencies?: Record<string, string[]>;
    }
  | { type: 'delegation'; orchestrator: string; specialists: string[] };

/**
 * 插件物化结果：可以是裸 `RuntimeAdapter`（由 loader 包成 Unit），或完整 `WorkflowUnit`。
 */
export type UnitPluginResult = RuntimeAdapter | WorkflowUnit;

/**
 * Unit 插件：静态结果，或接收 YAML `config` 的工厂（可异步）。
 */
export type UnitPlugin =
  | UnitPluginResult
  | ((config?: Record<string, unknown>) => UnitPluginResult | Promise<UnitPluginResult>);

/**
 * `uses` 名到插件的映射表，传给 {@link createEngineFromYaml} 的 `registry`。
 */
export type UnitPluginRegistry = Record<string, UnitPlugin>;

/**
 * {@link createEngineFromYaml} / 相关 loader 的用户选项。
 */
export interface CreateEngineFromYamlOptions {
  /**
   * 自定义 / 覆盖 `uses` 插件表。
   * 与 `bindings` 合并时，本字段同名键优先。
   */
  registry?: UnitPluginRegistry;
  /**
   * 将非内建 `uses` 名映射到远程 HTTP Unit。
   * 先并入 `bindings` 再与 `registry` 合并（显式 `registry` 冲突时胜出）。
   */
  bindings?: import('./bindings.js').UsesBindings;
  /**
   * 额外引擎选项，原样转发给 {@link createWorkflowEngine}
   *（如 `policyConfig`、自定义 Layer4 组件）。
   */
  engineOptions?: import('../core/workflow-engine.js').WorkflowEngineOptions;
}
