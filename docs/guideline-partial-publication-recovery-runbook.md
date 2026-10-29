# Partially reviewed guideline recovery runbook

## Purpose and safety boundary

Use this runbook when a published guideline has structural headings but too
little reviewed body content. Recovery always creates a new draft. Never edit
the published version, approve generated clinical content automatically, copy
review state between versions, manually promote chunks, or publish merely to
test the repair.

The original incident pattern was Diabetes `2026.09.01`: 310 sections, 16
reviewed blocks, all reviewed blocks tables, no reviewed paragraphs, and no
original/offline fallback. Regeneration correctly created blocks as `draft`;
the defect was that earlier publication gates allowed a highly incomplete
projection to replace the public version.

## Roles

- An editor with `guideline.markdown.edit` duplicates the version.
- A user with `guideline.structure.regenerate` runs regeneration.
- A reviewer with `guideline.review` checks and bulk-approves verified low-risk
  blocks and may reject regeneration.
- A clinical publisher with `guideline.high_risk.approve` reviews high-risk
  blocks/assets individually and accepts regeneration.
- A publisher with `guideline.publish` validates and deliberately publishes.

Separation is intentional. A reviewer must never approve content they have not
compared with the authoritative source.

## Prepare a replacement draft

1. Identify the exact published version UUID. Confirm its completeness report
   says `version_status: published` and includes a
   `published_markdown_revision_id`.
2. Choose a new, unique version later than the current label. Do not reuse
   `2026.09.01`.
3. Dry-run the helper from the repository root:

   ```bash
   MEDIGUIDE_API_URL=https://api.example.org \
   MEDIGUIDE_REPORT_TOKEN='<reviewer-token>' \
   ./scripts/prepare-guideline-recovery.sh \
     --source-version-id '<published-version-uuid>' \
     --new-version '2026.10.01'
   ```

4. Re-run with `--execute` only after the source identity and new version are
   correct. The helper duplicates the immutable published Markdown, queues one
   regeneration, waits up to 15 minutes, and writes a JSON completeness report
   in the current directory. It stops before every clinical decision.

   ```bash
   MEDIGUIDE_API_URL=https://api.example.org \
   MEDIGUIDE_REPORT_TOKEN='<reviewer-token>' \
   MEDIGUIDE_MARKDOWN_EDIT_TOKEN='<editor-token>' \
   MEDIGUIDE_REGENERATION_TOKEN='<regenerator-token>' \
   ./scripts/prepare-guideline-recovery.sh \
     --source-version-id '<published-version-uuid>' \
     --new-version '2026.10.01' \
     --execute
   ```

   The distinct tokens preserve the role separation described above. For local
   development only, one administrator token may be supplied through
   `MEDIGUIDE_ACCESS_TOKEN` as a fallback for all three operations.

Do not store access tokens in shell history, documentation, commits, CI logs,
or report attachments. Prefer an injected environment secret.

## Human review and acceptance

1. Open the new draft's Editorial Review page.
2. Compare the generated hierarchy with the authoritative Markdown/PDF.
3. Inspect **Publication completeness**. Confirm total sections and block types
   are plausible relative to the current publication.
4. Filter **Low-risk pending**. Bulk-select only paragraphs, headings, lists,
   references, and page breaks that were actually verified. Complete the
   explicit fidelity attestation. A stale revision/job response requires a
   refresh and re-verification; it is never partial success.
5. Filter **Pending high risk**. Review every table, recommendation, warning,
   caution, contraindication, dose, procedure, algorithm, referral criterion,
   and clinically sensitive asset individually.
6. Upload and review the original PDF or offline fallback if a partial
   publication is intended.
7. Return to regeneration review. Confirm its revision and job match the report
   exactly, then accept it. Never accept an older/superseded job.

## Readiness checklist

Publication validation must be `valid: true`, and the report must show:

- representative reviewed prose, not only tables;
- acceptable reviewed percentage for the intended publication;
- representative clinical leaves with reviewed blocks;
- no unexplained structural or reviewed-content regression;
- all high-risk content reviewed individually;
- `regeneration.identities_match: true` with an accepted review;
- reviewed fallback available when the publication remains partial;
- reviewed blocks synchronized to approved chunks; and
- no missing embeddings for chunks belonging to reviewed blocks
  (`rag.ready: true`); before publication those chunks can still be `draft`.

Chapter comparisons use explicit numbered chapter headings when available
(for example, `Chapter One`, `Chapter 1`, or `Chapter IV`), regardless of their
heading depth. This keeps front matter and formerly flat subsections from
inflating the old chapter count after a Markdown hierarchy repair. Documents
without named chapters use root sections, or the children of a single H1
document title. A chapter has reviewed coverage only if it or a descendant
contains a reviewed block. Section and block regression checks still apply.

Preview representative introduction, diagnostic, treatment, dosage/table, and
deeply nested leaf sections. Confirm total versus reviewed section labels are
not confused.

## Publication and post-publication verification

Publishing is a separate, explicit action by an authorized human. After it:

1. Fetch the public manifest and confirm the new version ID, schema/package
   version, checksum, total/reviewed section counts, reviewed paragraph count,
   and fallback flags.
2. Verify web and mobile readers use the same version/checksum and display
   reviewed content in representative leaves.
3. Verify an empty container navigates to reviewed descendants.
4. Verify an empty leaf offers the original only when it actually exists.
5. Download/open the offline package and verify its embedded manifest identity.
6. Search for a distinctive newly reviewed paragraph. Confirm it is returned
   with a citation resolving to the new current section.
7. Search for distinctive unreviewed/rejected text. Confirm it is absent.
8. Ask the general and guideline-scoped assistants. Confirm citations identify
   the current version and the coverage notice does not imply unreviewed
   sections were searched.

Attach the final JSON report and validation result to the release record.

## Rollback

Do not modify the bad or replacement published rows directly. If post-release
verification fails:

1. Stop further client rollout and record the failing version/checksum.
2. Use the supported publication rollback/current-version procedure to restore
   the last known-good published version; do not relabel draft chunks.
3. Invalidate/rebuild public manifests, offline packages, CDN/API caches, and
   mobile update metadata for the restored current version.
4. Verify search/RAG excludes the withdrawn version and citations resolve to
   the restored version.
5. Create another newer draft for corrections. Preserve audit events and both
   immutable versions for investigation.

The database and object-store backups are disaster-recovery safeguards, not a
normal editorial rollback mechanism.
