## ADDED Requirements

### Requirement: Cross-project reuse is primary narrative
The VitePress documentation (and README portal links) SHALL present cross-project reuse of the same orchestration contract as a primary product story: each project may use its language SDK; another project may be embedded as a Unit via standard I/O.

#### Scenario: Newcomer finds cross-project story
- **WHEN** a reader opens Why / guide pages about composition
- **THEN** they can explain that Uni-Flow targets shared orchestration across projects, not primarily mixed-language sub-agents inside one workflow

### Requirement: User-journey information architecture
The docs site navigation (nav/sidebar) SHALL follow a user-task order: decide fit (Why) → run one project (Install/Quickstart/YAML) → compose across projects (cross-project guide) → examples → API reference → architecture (deeper, not first). The former primary «跨语言» guide MUST be demoted to a secondary path or subsection under cross-project composition.

#### Scenario: Guide sidebar lists cross-project before cross-lang
- **WHEN** a newcomer opens the Guides sidebar
- **THEN** they see a cross-project reuse entry as a primary guide item, and cross-language is not presented as the main composition story

### Requirement: Home and 3W aligned to journey
The home page hero/features and the Why 3W page SHALL emphasize multi-project reuse and standard Unit boundaries; homepage feature copy MUST NOT lead with «跨语言同一套图» as the primary value (multi-language SDK may appear as a supporting point).

#### Scenario: Home CTA paths match journey
- **WHEN** a reader opens the docs home
- **THEN** they can reach Why, quickstart, and cross-project (or uses) paths without needing architecture as the first click

### Requirement: Comparison includes Mastra
The framework comparison page SHALL include Mastra alongside LangGraph-style frameworks: Mastra as a TypeScript in-app agent/workflow framework; Uni-Flow as a cross-project orchestration contract; conclusion MUST state complementarity (e.g. a Mastra agent MAY live inside a Unit), not replacement.

#### Scenario: Reader states Mastra relationship
- **WHEN** a reader finishes the vs-frameworks (or equivalent) page
- **THEN** they can say whether Uni-Flow replaces Mastra and what remains complementary

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

### Requirement: Cross-project guide page exists
The documentation SHALL include a dedicated cross-project guide covering Workflow-as-Unit, Unit `/execute` vs Orchestrator workflow-run (secondary), `params` / `$profile`, and links to demos.

#### Scenario: Guide is reachable from nav
- **WHEN** a reader opens Guides
- **THEN** they can open the cross-project page without hunting archived change notes

### Requirement: Tier-1 scope excludes full-site rewrite
This change MUST rewrite key journey pages listed above; it MUST NOT require rewriting every architecture module 3W page or every HTTP route handbook page in full (link tweaks allowed).

#### Scenario: Module handbook not mandated rewrite
- **WHEN** implementers check the tasks list for docs
- **THEN** full rewrites of all module 3W / HTTP route pages are not required checkboxes
