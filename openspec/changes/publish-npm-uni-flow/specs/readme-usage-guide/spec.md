## ADDED Requirements

### Requirement: README install matches published package
The root README SHALL document installing from npm with `npm install virtual-uni-flow` as the default consumer path once the package is published, without stating that registry publish is unavailable as the normal state.

#### Scenario: README shows npm install
- **WHEN** a reader opens README install / quick start for TS consumers
- **THEN** they see `npm install virtual-uni-flow` as the primary dependency instruction
