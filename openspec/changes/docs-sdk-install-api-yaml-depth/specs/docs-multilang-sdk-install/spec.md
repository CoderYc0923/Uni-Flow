## ADDED Requirements

### Requirement: Three-language install paths documented
The install guide SHALL document how to add Uni-Flow to a consumer project in TypeScript (npm), Python (pip), and Java (Maven and/or Gradle), including the intended package coordinates/names and, when packages are not yet published to a public registry, a working local/path install alternative.

#### Scenario: TS developer finds npm install path
- **WHEN** a TypeScript developer opens the install guide
- **THEN** they see an npm-oriented install command (published or documented interim path/github/workspace)

#### Scenario: Python developer finds pip install path
- **WHEN** a Python developer opens the install guide
- **THEN** they see a pip-oriented install command (e.g. `pip install uniflow-sdk` or `pip install -e sdk/python`)

#### Scenario: Java developer finds Maven or Gradle path
- **WHEN** a Java developer opens the install guide
- **THEN** they see Maven and/or Gradle dependency coordinates usable after local `mvn install` (or equivalent) if not yet on Maven Central

### Requirement: Per-language quickstart snippet
The guides SHALL include a short "first call" snippet per language: validate or register/run against Orchestrator (or in-process TS Engine), sufficient to prove the SDK is wired.

#### Scenario: Three languages have a first-call example
- **WHEN** a reader follows install then quickstart for each language
- **THEN** each language section shows at least one copy-pasteable call that uses the SDK

### Requirement: Cross-language Unit composition in guides
Guides SHALL explain that a project in language A can embed a project in language B as a remote Unit (HTTP `/execute` + bindings), with a concrete example such as TypeScript parent + Java child Unit, linking to Workflow-as-Unit / cross-project docs and demos.

#### Scenario: Reader can state TS+Java pattern
- **WHEN** a reader finishes the multilang install/composition section
- **THEN** they can describe installing both SDKs and binding a Java `/execute` endpoint from a TS workflow YAML
