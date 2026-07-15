# context-manager

## Purpose

Assemble layered memory (working, session, long-term, vector) for unit inputs with token budget and compaction.

## Requirements

### Requirement: Four-tier memory model
The system SHALL implement a four-tier memory model: Working Memory (unit-scoped), Session Memory (run-scoped), Long-term Memory (persistent), and Vector Memory (semantic retrieval).

#### Scenario: Working memory lifecycle
- **WHEN** a WorkflowUnit starts execution
- **THEN** Working Memory is initialized and cleared when the unit completes

#### Scenario: Session memory across units
- **WHEN** Unit A completes and Unit B starts in the same workflow run
- **THEN** Unit B's context assembly includes relevant outputs from Unit A via Session Memory

### Requirement: Context assembly with token budget
The system SHALL assemble context for each unit by merging memories per `ContextPolicy`, enforcing token budget, and applying compaction when exceeded.

#### Scenario: Token budget exceeded
- **WHEN** assembled context exceeds the configured token budget
- **THEN** the system applies the configured `CompactionStrategy` (sliding-window, summarize, or importance-rank) and sets `truncated: true`

#### Scenario: Vector retrieval
- **WHEN** `vectorMemory.enabled` is true in ContextPolicy
- **THEN** the system performs semantic search against configured collections and includes topK results in `AssembledContext.retrievedDocs`

### Requirement: Memory recording
The system SHALL record unit input/output pairs after each unit completes, writing to appropriate memory tiers per ContextPolicy.

#### Scenario: Record after unit completion
- **WHEN** a WorkflowUnit completes execution
- **THEN** ContextManager persists the interaction to configured memory tiers
