## ADDED Requirements

### Requirement: Light Element-like theme
The MkDocs Material site SHALL default to a light color scheme inspired by Element UI/Plus documentation aesthetics: near-white / light gray backgrounds, primary blue approximately `#409EFF`, thin borders, muted shadows, and no dark-mode-first presentation as the default experience.

#### Scenario: Local serve shows light UI
- **WHEN** a maintainer runs `mkdocs serve` (or `mkdocs build` and opens the home page)
- **THEN** the rendered site presents a light background and blue accent without requiring the user to toggle away from a dark default

### Requirement: Custom stylesheet hook
The repository SHALL include a custom stylesheet (e.g. `docs-site/stylesheets/extra.css`) wired from `mkdocs.yml` that refines Material chrome toward the Element-like look without replacing MkDocs Material as the theme engine.

#### Scenario: Stylesheet loaded
- **WHEN** `mkdocs.yml` is inspected
- **THEN** an `extra_css` (or equivalent) entry points at the custom stylesheet used for the Element-like refinements
