## MODIFIED Requirements

### Requirement: Root README exists with usage guide structure
The repository SHALL provide a root `README.md` written primarily in Simplified Chinese that acts as a **portal**: project one-liner and product Who/Why hook, install steps, a minimal runnable quick-start snippet, links to the **VitePress** documentation site for Why / architecture / full tutorials / API handbooks, pointers to examples and key repo paths, and license. Exhaustive tutorials, large Mermaid galleries, and full API guides MUST live primarily on the VitePress site (not duplicated in full inside README).

#### Scenario: Newcomer can find quick start
- **WHEN** a reader opens `README.md`
- **THEN** they can locate install commands and a minimal runnable example, and a clear link to the VitePress documentation site for deeper guides

#### Scenario: Full pipeline lives in docs site
- **WHEN** a reader needs architecture diagrams and API handbooks
- **THEN** README directs them to the VitePress site rather than embedding the full former long README or MkDocs-only paths as the sole source

## ADDED Requirements

### Requirement: README CTA targets VitePress Why and API
The README portal SHALL explicitly link to VitePress pages for product Why and API Reference (or the deployed Pages URL equivalent).

#### Scenario: Why and API links present
- **WHEN** a reader scans README documentation links
- **THEN** at least one link targets Why/3W content and at least one targets API reference on the VitePress site
