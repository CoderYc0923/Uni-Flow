## ADDED Requirements

### Requirement: Examples section hosts business stories
Business narrative examples such as accounting intent routing SHALL live under the VitePress Examples section (and may reference `examples/accounting-router.yaml`), not as the primary spine of Why/Architecture chapters.

#### Scenario: Accounting example page exists
- **WHEN** a reader opens Examples
- **THEN** they can find an accounting Router example page that explains the story and points to runnable artifacts

### Requirement: Example index
The Examples section SHALL index key runnable artifacts (Sequential, accounting Router, cross-lang, templates) with short descriptions and links to guides/API as needed.

#### Scenario: Index lists accounting and sequential
- **WHEN** a reader opens the examples index
- **THEN** both sequential and accounting-router style entries are discoverable
