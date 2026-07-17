## ADDED Requirements

### Requirement: Cross-project reuse is primary narrative
The VitePress documentation (and README portal links) SHALL present cross-project reuse of the same orchestration contract as a primary product story: each project may use its language SDK; another project may be embedded as a Unit via standard I/O.

#### Scenario: Newcomer finds cross-project story
- **WHEN** a reader opens Why / guide pages about composition
- **THEN** they can explain that Uni-Flow targets shared orchestration across projects, not primarily mixed-language sub-agents inside one workflow

### Requirement: Uses decision tree updated
The uses / integration guide SHALL update the decision tree so that in-process registry, HTTP remote Unit (cross-project/deploy boundary), and Sidecar remain clear; multi-language SDK appears as language choice for each project, not as the reason HTTP exists.

#### Scenario: Decision tree distinguishes motives
- **WHEN** a reader opens the uses guide decision tree
- **THEN** HTTP Unit is described as a project/deploy boundary (which may be cross-language) rather than only as “use another language inside one workflow”

### Requirement: Control plane documented
Docs SHALL document the four control channels: ControlFlow topology, `policyOverrides`, `contextPolicy`, and `AgentInput.params`, including merge priority and the ban on secrets in `params`.

#### Scenario: Reader maps a RAG topK to the right channel
- **WHEN** a reader wants to pass retrieval `topK` from a parent to a RAG Unit
- **THEN** docs direct them to `params` (or profile docs), not to `contextPolicy` as the primary home for that business knob
