## ADDED Requirements

### Requirement: Profile as documentation convention
Capability profiles (e.g. `rag.v1`) SHALL be defined as documentation/wrapper conventions, not as Engine-validated schemas. Profile identity MAY appear as `params.$profile` (string). The Engine MUST NOT reject unknown `$profile` values or unknown params keys.

#### Scenario: Engine ignores unknown profile
- **WHEN** a Unit receives `params: { "$profile": "rag.v1", "topK": 5 }` through the Engine
- **THEN** execution proceeds without Engine schema validation of `rag.v1` fields

### Requirement: Profile documentation template
The documentation site or contract docs SHALL describe how to author a capability profile: name/version, required vs optional params keys, defaults, and example `AgentOutput.metadata` keys consumers may rely on.

#### Scenario: Author finds profile template
- **WHEN** a capability author opens the cross-project / profile guide
- **THEN** they can list the fields needed to publish a new `*.vN` profile description

### Requirement: Versioning and unknown fields
Profiles SHOULD use `name.vN` versioning; breaking field renames MUST bump the major version in documentation. Wrappers SHOULD ignore unknown params keys unless the profile documents otherwise.

#### Scenario: Unknown key ignored by wrapper convention
- **WHEN** a request includes an extra params key not listed in the profile
- **THEN** a conforming wrapper still executes using known keys (unless the profile explicitly requires strict mode)

### Requirement: Programmable metadata keys
Profile docs MAY list stable `AgentOutput.metadata` keys for parent routing/logic (e.g. `route`, `citations`, `confidence`). The Engine MUST continue to pass `metadata` through without processing domain media pipelines.

#### Scenario: Parent can read metadata route
- **WHEN** a child Unit returns `metadata.route` as a string
- **THEN** parent SharedState / Router conventions can consume that value as today (e.g. via outputAdapter writing `route`)
