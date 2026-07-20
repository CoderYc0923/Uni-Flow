## ADDED Requirements

### Requirement: Java SDK build metadata
The Java SDK directory SHALL include Maven (`pom.xml`) or Gradle build metadata so consumers can install the SDK into a local Maven repository (or build a jar) and declare a dependency from another Java project.

#### Scenario: Local Maven install works
- **WHEN** a maintainer runs the documented Maven (or Gradle) install command for `sdk/java`
- **THEN** a jar is produced or installed locally without requiring undocumented manual classpath hacks

### Requirement: SDK READMEs match install guide
Python and Java SDK READMEs (and TypeScript package docs as applicable) SHALL state the same primary install commands as the VitePress install guide (including interim path installs when unpublished).

#### Scenario: Python README shows pip path
- **WHEN** a reader opens `sdk/python/README.md`
- **THEN** they see a pip install instruction consistent with the docs site
