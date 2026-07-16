## ADDED Requirements

### Requirement: Two-layer model with diagrams
The architecture section SHALL explain Uni-Flow as ControlFlow (macro scheduling) composing WorkflowUnits (micro execution), include at least one Mermaid (or equivalent) overview diagram, and SHALL NOT present Think/Execute/Observe as the top-level system architecture.

#### Scenario: Reader states two layers
- **WHEN** a reader finishes the core model page
- **THEN** they can describe outer ControlFlow vs inner Unit/Adapter without equating the product to a global ReAct triad

### Requirement: Pipeline and Layer4 explained persuasively
The architecture section SHALL document the unit execution pipeline in engine order (Policy → Security → Context → Execute → post-hooks → record → checkpoint → observability → MessageBus) and explain Layer4 components with counterfactuals (what goes wrong without them), not only feature lists.

#### Scenario: Pipeline order matches engine
- **WHEN** a reader compares the documented pipeline to `DefaultWorkflowEngine` behavior
- **THEN** the documented stage order matches the implemented hook sequence

### Requirement: Module 3W coverage
The architecture section SHALL provide a module map and per-module Who/Why/How (including “what if missing” and repository maturity ✅/🟡/⬜) for core modules including at least: WorkflowUnit, RuntimeAdapter, ControlFlow, SharedState, MessageBus, Engine, Layer4 components, YAML loader, Orchestrator, and SDKs/CLI.

#### Scenario: Module page answers why
- **WHEN** a reader opens a module 3W page (e.g. ControlFlow)
- **THEN** they see who uses it, why it exists, how to use it, and current repo status

### Requirement: Design longform lives on the site
The longform design document content from `Agent统一工作流模式设计.md` SHALL be available inside the VitePress site as an appendix with a reader guide pointing to the architecture section first; root repo MAY keep a stub link.

#### Scenario: Appendix reachable from nav
- **WHEN** a reader opens Architecture/Planning navigation
- **THEN** they can open the design longform appendix without leaving the docs site

### Requirement: Accounting story excluded from architecture spine
Architecture and Why pages MUST NOT use the accounting routing story as the primary narrative spine; neutral Router/Unit language is required there.

#### Scenario: Architecture page has no accounting spine
- **WHEN** a reader opens the two-layer model / pipeline pages
- **THEN** those pages do not depend on the lunch/accounting story as the main explanation vehicle
