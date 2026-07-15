## ADDED Requirements

### Requirement: CI workflow publishes documentation
The repository SHALL include a GitHub Actions workflow that builds the MkDocs site and deploys it to GitHub Pages on pushes to the default branch (and SHOULD support manual `workflow_dispatch`).

#### Scenario: Workflow file present
- **WHEN** a maintainer inspects `.github/workflows/` for docs/Pages
- **THEN** a workflow exists that installs Python docs dependencies, runs `mkdocs build`, and deploys the generated site artifact

### Requirement: Deploy configuration documented
The repository SHALL document how to enable GitHub Pages (Actions source), the expected public URL pattern, and that the build output directory is not committed (ignored in git).

#### Scenario: Maintainer can enable Pages
- **WHEN** a maintainer follows the docs deploy section
- **THEN** they know to set Pages source to GitHub Actions and where to put `site_url` in `mkdocs.yml`
