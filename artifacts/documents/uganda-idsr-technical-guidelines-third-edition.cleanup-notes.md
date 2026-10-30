# IDSR Markdown cleanup notes

Source: the pasted National Technical Guidelines for Integrated Disease Surveillance and Response, Third Edition, April 2023. The source describes a 427-page scanned PDF. This cleanup uses that supplied OCR text and the existing 17 locally available cropped figure assets.

## Formatting completed

- One H1 title, introduction section, all 11 numbered IDSR sections and the references are retained.
- Rebuilt a linked table of contents using MediGuide's backend anchor rules.
- Recovered a 64-name acknowledgments table, 120 abbreviation entries, and 26 glossary definitions from collapsed front-matter columns.
- Contributor role/function and institution columns were interleaved beyond reliable automatic pairing. No title or affiliation was guessed; the complete supplied acknowledgment text is retained in the accompanying source-ocr.txt file.
- Restored displaced glossary term/definition boundaries; full original OCR is included for comparison.
- Repaired clearly split headings, removed repeated ancestor strings from headings and disambiguated repeated headings with continuation labels.
- Numbered the 47 disease headings within Section 11 and their subheadings for consistent navigation. Moved form fields under the annex hierarchy and demoted 4 numeric prose/dosage fragments incorrectly treated as section headings.
- Standardized numeric and alphabetic lists, expanded 8 clear run-together sequential lists, rejoined lower-case continuation text, removed isolated Roman page labels and moved conversion-only metadata out of the reading text.
- Encoded less-than/greater-than symbols as Markdown-safe entities without changing their comparison values.
- Replaced NA image labels with context-based alternative text. Every image URI, UUID and placement remains unchanged.

## Assets and portability

The document contains 95 image placements: 17 local figure files and 78 managed-image references representing 75 distinct version-bound asset IDs. Only the 17 local images are available in the workspace and included in the ZIP. Managed image bytes were not supplied. Their identifiers are preserved in the Markdown and listed in the asset inventory; they must belong to the destination version or be replaced with the correct uploaded assets. This package is not a fully standalone export of those managed images.

## Source limitations retained for review

- Many source tables, laboratory instructions, forms and diagram labels are flattened or interleaved OCR, not reliable Markdown tables. Clinical cells, doses, timings, thresholds and response choices were not guessed or silently reordered. The complete source body remains available and must be compared with the source PDF where the extraction is damaged.
- Reconstructed glossary wording and displaced abbreviation definitions should be checked against the PDF. JAR, USMR, IFA and other potentially OCR-sensitive abbreviations retain the supplied spellings.
- The source has missing or inconsistent subsection numbers, annex identifiers, truncated headings, and context duplication. Existing cross-reference identifiers were preserved rather than renumbering all clinical content.
- The bibliography contains missing and displaced reference numbers, joined citations and broken URLs. These have not been renumbered because doing so could misidentify cited sources.
- Names, clinical wording, numeric quantities, statistics and historical/legal claims have not been independently fact-checked or modernized.
- Some figure content appears both as managed images and as local figures, with nearby OCR text. No unverified managed/local image pairing was removed.

## Package contents

Cleaned Markdown; this note; the full supplied source OCR; a machine-readable asset inventory; and all 17 local image assets in their original relative paths.

## Validation

Checked using MediGuide’s backend Markdown validator, with existing managed asset IDs represented as version assets. No formatting errors were reported. Existing clinical dosage, table-review and local-image advisories remain. One form-field heading-level jump was repaired. This check does not verify the managed assets exist in a different destination version.
