# MediGuide v2.1.24

Changes since v2.1.23. Mobile version: 2.1.24+77.

## Mobile application

- No mobile feature changes since v2.1.23; synchronize the platform version to 2.1.24+77 and retain the canonical dependency lockfile.

## API

- No API behavior or database migration changes since v2.1.23.

## AI worker

- No service-specific changes since v2.1.23.

## Dashboard

- Refresh the overview, account analytics, clinical guidelines, drug index, decision tools, outbreak response, user management, health facilities, support and settings workspaces with full-width layouts and clearer management actions.
- Group sidebar sections by workflow, remove duplicated submenus, and provide shared page tabs for outbreak management. Account analytics remains accessible from the dashboard.
- Open creation forms in local dialogs without changing the URL or browser history. Remove cross-section tabs from creation and edit forms and place content hub Cancel and Save actions below the fields.
- Update breadcrumbs when navigating between sections, with readable record labels and links to valid parent pages.
- Improve disease classification and content hub libraries with status filters, descriptions, scope details and server-backed pagination.
- Use consistent rows-per-page controls, centered result counts and first, previous, next and last navigation across data tables, review screens and audit histories.
- Keep calculator, decision-tool and checklist query caches separate so each type chip shows the correct records.
- Prevent the editorial review toolbar from overlapping source and extraction panels, and paginate bulk review blocks while preserving selection safeguards.
- Retain protected tool usage statistics with a paginated daily breakdown, accessible loading states and recovery actions.

## Public guidelines portal

- No public portal behavior changes since v2.1.23.

## Deployment and operations

- Publish the API, AI worker, dashboard and public guidelines images under the immutable 2.1.24 tag and deploy the verified image set through the protected production workflow.
- No new database migrations are introduced relative to v2.1.23. Preserve the existing production data and runtime settings through the standard deployment procedure.
- Run Docker dashboard development on Node 22 and Webpack rather than the stalled Bun/Turbopack setup, with bounded health checks and a longer cold-compilation grace period.
- Include the clinical guidelines workflow SOP and screen-based documentation. Clinical content publication remains an explicit editorial workflow.
- Mobile store submission remains a separate promotion; this release does not start a store rollout.
- Run dashboard tests on Node, matching the production runtime and avoiding Bun-only Zod namespace import failures in CI. Bun remains the locked dependency installer.
