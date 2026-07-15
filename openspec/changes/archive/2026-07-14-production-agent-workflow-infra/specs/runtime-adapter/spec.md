## ADDED Requirements

### Requirement: RuntimeAdapter execution contract
The system SHALL define a `RuntimeAdapter` interface that abstracts Agent execution from any specific framework. Each adapter MUST implement `execute`, `steer`, `followUp`, `subscribe`, `cancel`, and `frameworkInfo` methods.

#### Scenario: Execute agent via adapter
- **WHEN** a WorkflowUnit is scheduled for execution
- **THEN** the engine invokes `RuntimeAdapter.execute(input, executionContext)` and receives an `AgentOutput`

#### Scenario: Runtime intervention
- **WHEN** the orchestrator calls `steer(content)` or `followUp(content)` on a running unit
- **THEN** the adapter translates the call to the underlying framework's native mechanism

### Requirement: Framework Bridge adapters
The system SHALL provide Bridge adapters for pi-agent-core, LangGraph, LangChain, LangChain4j, MCP, and HTTP endpoints. Each adapter MUST be usable as a Unit Wrapper without modifying the wrapped application's internal logic.

#### Scenario: LangGraph Unit Wrapper
- **WHEN** an existing LangGraph graph is wrapped with `LangGraphAdapter`
- **THEN** the graph executes unchanged and the orchestrator sees only input/output boundaries

#### Scenario: MCP adapter
- **WHEN** an Agent Unit is exposed as an MCP Server
- **THEN** the `McpAdapter` invokes the server and maps responses to `AgentOutput`

### Requirement: Sidecar injection mode
The system SHALL support Sidecar mode where existing frameworks connect to Uni-Flow infrastructure by implementing their native interfaces (e.g., LangGraph `BaseCheckpointSaver`, LangChain `BaseMemory`).

#### Scenario: LangGraph Sidecar checkpointer
- **WHEN** a LangGraph project replaces its checkpointer with `UniFlowCheckpointer`
- **THEN** checkpoint data is stored in Uni-Flow CheckpointStore without changing graph structure
