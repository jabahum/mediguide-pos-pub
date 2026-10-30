# MediGuide v2.1.25

Changes since v2.1.24. Mobile version: 2.1.25+78.

## Mobile application

- Synchronize the application version to 2.1.25+78; no mobile feature changes since v2.1.24.

## API

- Count explicitly named chapters consistently across PDF and Markdown hierarchies to prevent false reviewed-coverage regression blockers; preserve section, block and genuine chapter-loss checks.

## AI worker

- No service-specific changes since v2.1.24.

## Dashboard

- Raise the TinyMCE dependency minimum to 8.9.3 and lock version 8.10.1 to resolve the production dependency security audit.

## Public guidelines portal

- No service-specific changes since v2.1.24.

## Deployment and operations

- Include cleaned EBS, antimicrobial resistance action plan and third-edition IDSR Markdown packages with available figures, editorial notes and corrected navigation.
- The IDSR package preserves 75 version-bound image asset IDs; those image bytes are not included. Clinical OCR, table, dosage and source inconsistencies still require source comparison and the normal editorial review workflow.
- Introduce no database migrations or automatic clinical content publication. Release the existing platform fixes together with the document packages.
