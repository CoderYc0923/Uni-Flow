## ADDED Requirements

### Requirement: Package metadata is publish-ready
The `uni-flow` package.json SHALL include npm-required and consumer-facing metadata: `name`, `version`, `description`, `license`, `repository`, `homepage` (or docs URL), and `engines`, and SHALL declare `files` / `exports` / `bin` such that the published tarball contains `dist` and `schemas` needed to import and run the CLI.

#### Scenario: Metadata fields present
- **WHEN** a maintainer inspects `package.json` before publish
- **THEN** `license`, `repository`, and `files` are set and `bin.uniflow` points at the built CLI entry

### Requirement: License file shipped with the package
The repository root SHALL contain a `LICENSE` file matching `package.json` `license`, and that file SHALL be included in the npm package.

#### Scenario: LICENSE in pack listing
- **WHEN** a maintainer runs `npm pack` (or dry-run listing)
- **THEN** the archive includes `LICENSE`

### Requirement: Pre-publish build gate
Publishing SHALL rebuild (or equivalently guarantee up-to-date) `dist` before upload so consumers do not receive a stale or missing build.

#### Scenario: prepublishOnly or documented gate
- **WHEN** `npm publish` is invoked for a release
- **THEN** a `prepublishOnly` (or documented mandatory prior `npm run build`) ensures `dist` exists for the release

### Requirement: First public release and verify
The project SHALL publish `uni-flow` to the public npm registry at the agreed version (default `0.1.0` if free), then verify with `npm view` and a clean-directory install that `import` from `uni-flow` resolves.

#### Scenario: Clean install works after publish
- **WHEN** publish succeeds and a fresh directory runs `npm install uni-flow`
- **THEN** Node can resolve the package entry without Git/`file:` dependency

### Requirement: Name conflict handling
Before the first publish, maintainers SHALL check whether `uni-flow` is already taken on npm by an unrelated package; if taken, they MUST NOT overwrite it and MUST stop to choose a scoped or alternate name.

#### Scenario: Occupied name blocks publish
- **WHEN** `npm view uni-flow` shows an unrelated owned package
- **THEN** publish of this project under that exact name does not proceed without an explicit rename decision
