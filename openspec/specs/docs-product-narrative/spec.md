# docs-product-narrative

## Purpose

VitePress Why section: product 3W, framework comparison (LangGraph / Mastra), and resilience to agent-pattern change.

## Requirements

### Requirement: Product Who Why How
The documentation site SHALL include a page (or tightly linked pages) that state Uni-Flow's audience (Who), motivation (Why), and adoption path (How) in Simplified Chinese, without requiring the reader to first learn ControlFlow jargon catalogs. Who/Why MUST emphasize teams that need the same orchestration contract across projects (and may embed another project's capability as a Unit), not only in-process multi-agent scheduling.

#### Scenario: Newcomer finds 3W
- **WHEN** a reader opens the Why Uni-Flow section
- **THEN** they can identify who the product is for, why it exists, and how to start adopting it

#### Scenario: 3W mentions cross-project reuse
- **WHEN** a reader opens the product 3W page
- **THEN** cross-project Unit reuse (or equivalent wording) appears in Who or Why, not only cross-language mixing

### Requirement: Comparison with mature frameworks
The documentation site SHALL include an explicit comparison covering at least LangGraph and Mastra: shared traits where applicable; differences (YAML/ControlFlow outer standard, runtime-agnostic Unit, cross-project HTTP Unit vs Mastra's TypeScript in-app agent/workflow stack); concluding that Uni-Flow does not replace LangGraph or Mastra and MAY wrap such runtimes inside a Unit.

#### Scenario: Reader sees LangGraph relationship
- **WHEN** a reader opens the framework comparison page
- **THEN** they can state whether Uni-Flow replaces LangGraph and what remains complementary

#### Scenario: Reader sees Mastra relationship
- **WHEN** a reader opens the framework comparison page
- **THEN** they can state whether Uni-Flow replaces Mastra and that complementarity (Unit wrapper) is the recommended framing

### Requirement: Resilience to agent-pattern change
The documentation site SHALL explain stable vs volatile layers (Unit/ControlFlow/pipeline/contracts vs in-unit reasoning/models/topology plugins) and MUST correct the misconception that top-level architecture is Think/Execute/Observe.

#### Scenario: Reader maps change impact
- **WHEN** a reader asks what breaks if ReAct-style loops fall out of fashion
- **THEN** the resilience page indicates which layer changes (Unit internals / ControlFlow composition) versus which contracts stay stable
