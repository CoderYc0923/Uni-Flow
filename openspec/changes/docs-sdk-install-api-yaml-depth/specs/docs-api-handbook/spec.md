## ADDED Requirements

### Requirement: Purpose section on handbook pages
Each hand-written API handbook page for a public surface SHALL include an explicit purpose section (or equivalent lead paragraph) stating what the API is for, in addition to signature/parameters/returns/errors/examples.

#### Scenario: Purpose visible on HTTP route page
- **WHEN** a reader opens any Orchestrator HTTP route handbook page in scope
- **THEN** they can state the route's purpose without inferring only from the path string

### Requirement: Reference index links inventory
The API reference index SHALL link to the complete API inventory (or embed it) so newcomers can scan all APIs before opening individual handbooks.

#### Scenario: Index points to inventory
- **WHEN** a reader opens `/reference/` (or equivalent)
- **THEN** they find a clear link or section for the full API inventory with purposes
