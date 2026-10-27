# MediGuide v2.1.23

Changes since v2.1.22. Mobile version: 2.1.23+76.

## Mobile application

- Improve navigation labels, filter chips, tool icons and settings sheets across the mobile application.
- Filter clinical tools by category and display their configured icons; refresh generated API contracts and reader baselines.

## API

- Add tool categories and risk levels with review rules for clinical tool versions.
- Expose protected per-tool usage totals, distinct users, ended sessions and daily sessions for the last 30 UTC days.
- Preserve session retry deduplication and report usage across all published tool versions.

## AI worker

- Include contraindications, dosages, evidence, definitions, procedures, algorithm references and referral criteria when building search chunks.

## Dashboard

- Replace the tool Usage placeholder with real session statistics, a daily breakdown, refresh controls and explicit error and empty states.
- Add clinical tool category management, risk-level selection, icon selection and clearer authoring and audit views.
- Update Next.js to 16.4.3 and Zod to 4.6.7 throughout the dependency tree to restore the production dependency audit.
- Remove the separate outbreak publication review page and simplify outbreak and situation-report management actions.

## Public guidelines portal

- No service-specific changes since v2.1.22.

## Deployment and operations

- Apply migrations 00086 (tool categories and risk levels) and 00087 (per-tool usage analytics index) through the standard deployment migration step.
- Tool usage statistics require analytics.read or admin.all. Sessions measure authenticated mobile tool opens, not completed assessments; offline sessions appear after synchronization.
- Remove the public storage HTTPS health probe as a production deployment gate while retaining internal service health checks.
- Publish all five component versions as 2.1.23 and build mobile 2.1.23+76. Store submission remains a separate promotion.
- Include the corrected mortality surveillance guideline import package; clinical content still requires the normal authoring and publication review.
