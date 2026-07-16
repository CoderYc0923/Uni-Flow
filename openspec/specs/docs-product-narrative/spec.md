# docs-product-narrative

## Purpose

VitePress Why section: product 3W, framework comparison, and resilience to agent-pattern change.

## Requirements

### Requirement: Product Who Why How
The documentation site SHALL include a page (or tightly linked pages) that state Uni-Flow's audience (Who), motivation (Why), and adoption path (How) in Simplified Chinese, without requiring the reader to first learn ControlFlow jargon catalogs.

#### Scenario: Newcomer finds 3W
- **WHEN** a reader opens the Why Uni-Flow section
- **THEN** they can identify who the product is for, why it exists, and how to start adopting it

### Requirement: Comparison with mature frameworks
The documentation site SHALL include an explicit comparison covering at least LangGraph: shared traits (graph/node orchestration) and differences (YAML/ControlFlow outer standard, runtime-agnostic Unit, cross-lang HTTP), concluding that Uni-Flow does not replace LangGraph and MAY wrap it inside a Unit.

#### Scenario: Reader sees LangGraph relationship
- **WHEN** a reader opens the framework comparison page
- **THEN** they can state whether Uni-Flow replaces LangGraph and what remains complementary

### Requirement: Resilience to agent-pattern change
The documentation site SHALL explain stable vs volatile layers (Unit/ControlFlow/pipeline/contracts vs in-unit reasoning/models/topology plugins) and MUST correct the misconception that top-level architecture is Think/Execute/Observe.

#### Scenario: Reader maps change impact
- **WHEN** a reader asks what breaks if ReAct-style loops fall out of fashion
- **THEN** the resilience page indicates which layer changes (Unit internals / ControlFlow composition) versus which contracts stay stable
