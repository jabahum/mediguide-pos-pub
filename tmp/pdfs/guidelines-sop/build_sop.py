from pathlib import Path
import json, re, textwrap
from html import escape
from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT = Path('/Users/jaba/Documents/projects/web/mediguide-pos')
WORK = ROOT / 'tmp/pdfs/guidelines-sop'
OUT = ROOT / 'output/pdf/mediguide-clinical-guidelines-dashboard-sop.pdf'
FONT = '/System/Library/Fonts/Supplemental/Arial.ttf'
BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
pdfmetrics.registerFont(TTFont('Arial', FONT))
pdfmetrics.registerFont(TTFont('ArialBold', BOLD))
INK, TEAL, MUTED, LINE, LIGHT = '#132D3B', '#087E83', '#556875', '#DCE5E9', '#F1F6F7'

pages = []
def add(title, intro, scene, steps, gate, caution='', lane='AUTHOR', labels=None):
    pages.append(dict(title=title,intro=intro,scene=scene,steps=steps,gate=gate,caution=caution,lane=lane,labels=labels))

add('The complete workflow',
    'Use this map to keep the source, generated content, review decisions and public version aligned.', 'flow', [
    ('Create and upload', 'Create a guideline document and a version. Upload the authoritative source and wait for processing. See pages 5-8.'),
    ('Edit and regenerate', 'Correct the Markdown, tables and images. Save the intended revision and regenerate its reader content. See pages 9-15.'),
    ('Review and accept', 'Review ordinary prose as well as safety-sensitive blocks. Check completeness and accept the exact regenerated revision. See pages 16-21.'),
    ('Publish and verify', 'Validate and publish, then verify the website, mobile reader, downloads and search. See pages 22-24. Notifications, updates and exceptions follow on pages 25-29.')],
    'Saving, reviewer assignment, generation completion and a private preview do not publish a guideline.',
    'Keep the last approved publication available while its replacement is prepared.', lane='WORKFLOW MAP')

add('People, access and preparation',
    'Assign responsibility before starting. The organization must authorize clinical decisions and publication.', 'roles', [
    ('Author / editor', 'Needs document creation access plus guideline.markdown.read, guideline.markdown.edit, guideline.markdown.upload, guideline.asset.manage and guideline.structure.regenerate for the assigned work. Prepare the authoritative PDF or UTF-8 Markdown, images and issuing organization.'),
    ('Reviewer', 'Uses guideline.review. High-risk clinical decisions and regeneration acceptance also require guideline.high_risk.approve. Compare content with the authoritative source; use an independent reviewer where local governance requires it.'),
    ('Publisher', 'Needs guideline.publish and access to the document. The server still enforces publication validation. An administrator cannot bypass missing review by changing a dashboard badge.'),
    ('Before uploading', 'Confirm title, document kind, version label, source organization, country, language, publication/review dates, applicable categories and diseases. Avoid patient-identifiable information in training files or review notes.')],
    'An active account with the correct role can see the expected controls. If a control is missing, ask an administrator to check permissions.',
    'Assignment is coordination, not clinical approval. Never approve content merely to clear a warning.', lane='ALL ROLES')

add('Choose the correct document route',
    'The selected document kind determines whether readers receive structured content, an original file, or a link.', 'routes', [
    ('Structured clinical guideline', 'Choose a normal guideline kind for searchable, editable chapters and blocks. Upload PDF, .md or .markdown. Follow the full editing, regeneration, review and publication process in pages 5-24.'),
    ('Publish as uploaded', 'Some kinds, such as forms, keep the PDF or Word (.docx) file exactly as uploaded. Text indexing supports discovery, but there is no Markdown editing or structured-block workflow. See page 27.'),
    ('Publish as link', 'A link kind publishes a complete HTTPS URL. No source file is uploaded and no extraction or Markdown editor runs. Review the destination before publishing. See page 27.'),
    ('Choose deliberately', 'Use categories and diseases for discovery. Legacy program area is optional. If the expected structured workflow is absent, check the document kind instead of uploading the same file repeatedly.')],
    'For an editable clinical guideline, continue with the structured route.',
    'Do not select an original-file or link kind just to avoid clinical review requirements.', lane='AUTHOR')

add('Create the guideline record',
    'Dashboard > Clinical Guidelines > Create Guideline. This record describes the document across all its versions.', 'metadata', [
    ('Open the creation wizard', 'Select Create Guideline from the guidelines area. The four stages are Create guideline, Create version, Upload version, and Review and edit.'),
    ('Complete the metadata', 'Enter the official title and select Document kind. Add Source organization, Country and Language code. Add a description that explains the document without changing its clinical meaning.'),
    ('Classify for discovery', 'Select every relevant Category and Disease, then a Primary disease from the selected diseases. Use active taxonomy entries. Classification supports browsing and hub placement; it is not publication approval.'),
    ('Save the record', 'Select Create and Continue. Confirm that the next stage names the correct document. To correct document-level metadata later, use Edit Metadata on the document page.')],
    'The guideline record exists and the wizard advances to Create version.',
    'Use the source title consistently; a template title or unrelated Markdown H1 can block publication.', labels=['Title','Document kind','Source organization','Country / Language','Categories / Diseases','Create and Continue'])

add('Create the first version',
    'Document version labels identify the clinical edition; they are separate from the MediGuide application release.', 'version', [
    ('Name the edition', 'In Create first version, enter the official Version label, such as 2026.1. Choose a label that is unique for this document and follows the organization\'s naming convention.'),
    ('Record the dates', 'Enter Publication date and Review date when applicable. These describe the guideline edition; entering a date does not schedule or perform publication.'),
    ('Create the draft', 'Select Create Version. A saved version is required before uploading source files. Finish Later returns to the document, where New Version can create additional editions.'),
    ('Confirm your target', 'Before any upload or edit, check the document title, version label and draft state. Published versions are immutable; updates use a new draft rather than an in-place edit.')],
    'The draft version is listed under Versions and the upload stage is available.',
    'Do not reuse an existing edition label for a replacement. Retain older versions for audit.', labels=['Version: 2026.1 (example)','Publication date','Review date','Create Version'])

add('Upload the authoritative source',
    'The source is the fidelity reference for every subsequent correction and clinical review decision.', 'upload', [
    ('Choose a supported file', 'In Upload guideline source, choose the authoritative PDF or UTF-8 Markdown (.md / .markdown). The creation screen allows up to 100 MB. For an existing draft, use Upload PDF to open the source dialog, which also accepts Markdown.'),
    ('Transfer the source', 'Select Upload source. The screen checks the file, transfers it, verifies storage and queues processing. Keep the selected version unchanged during the upload.'),
    ('Resume safely', 'Pause is available during transfer. To resume, choose the same file and select Resume upload; the screen preserves completed upload parts for up to 24 hours. Cancel upload abandons the transfer session.'),
    ('Choose another starting path if needed', 'Start with blank Markdown or Start from template opens authoring without PDF extraction. Existing Markdown may also be loaded from the editor. Obtain the original images separately for Markdown imports.')],
    'Storage verification finishes and Source transfer and processing shows a real processing job.',
    'An upload reaching 100% is not proof that extraction, indexing, clinical review or publication succeeded.', labels=['Choose guideline PDF or Markdown file','Checking file / uploading / verifying','Upload source','Pause','Resume upload'])

add('Monitor extraction and indexing',
    'Wait for the real processing result. A large PDF can take time, especially when OCR or table extraction is required.', 'processing', [
    ('Watch the stage list', 'Follow Source transfer and processing. It reports the current stage, progress, attempts and any available timings. The wizard refreshes while extracted Markdown is still unavailable.'),
    ('Wait for usable output', 'When processing completes, open the document and choose Edit Markdown or Editorial Review as appropriate. Preview original keeps the source available for comparison; processing completion alone does not make extracted blocks approved.'),
    ('Handle a failed job', 'Read the error and failing stage. Retry processing is offered for eligible failed/canceled jobs and reuses completed checkpoints where possible. An automatic retry time may also be shown.'),
    ('Escalate a persistent failure', 'Record the title, version, job identifier, stage, attempt count, time and error. Ask an administrator to investigate worker/storage/embedding failures. Do not create several duplicate documents to work around one job.')],
    'The correct draft has its extracted source and is ready for editorial work.',
    'Do not assume a fixed completion time or that a quiet progress bar means the job has failed.', labels=['Stored source','Extraction / OCR','Tables and images','Sections and blocks','Search / embeddings','Ready for editorial review'])

add('Open the Markdown workspace',
    'Document > draft version > Edit Markdown (or Author Markdown when starting without extracted source).', 'editor', [
    ('Check the version and revision', 'Confirm the guideline title and version. The editor shows the saved revision and structured-content status. Work in the draft intended for publication.'),
    ('Choose a working view', 'Use Edit, Split or Preview. Split makes it easier to compare source syntax and rendered output. Use Original PDF where available to verify fidelity; Markdown-only sources cannot claim PDF page citations.'),
    ('Inspect the whole document', 'Review the outline, front matter, chapter boundaries, paragraphs, lists, links, tables, figures and footnotes. Check the beginning, middle and end, not only the first chapter.'),
    ('Use private previews carefully', 'Reader, mobile, search and RAG presentations help expose structural problems. They are previews, not evidence that content has been published or clinically approved.')],
    'The editor contains the correct complete source for the draft edition.',
    'Retain the authoritative source beside the editor. Extraction can lose text or reorder content without an obvious syntax error.', labels=['Edit | Split | Preview','Save draft','Regenerate','Source Markdown','Rendered preview','Validation guidance'])

add('Repair headings and reading order',
    'A clear hierarchy becomes the chapter and section navigation on the website and mobile app.', 'hierarchy', [
    ('Use one document title', 'Keep one H1 (# Guideline title). Use H2 (##) for chapters or major front matter, H3 for major sections within a chapter and H4 for subsections. Do not skip heading levels.'),
    ('Match the source structure', 'Preserve the sequence and meaning of chapters. Remove repeated page headers/footers only after checking the source. Keep clinically meaningful notes, references and appendices.'),
    ('Replace training/template content', 'Replace template titles, unchanged template headings and every _Add reviewed clinical content._ marker. A template provides structure, not clinical wording.'),
    ('Check navigation and anchors', 'Preview the section outline and internal links. Renamed headings may retain stable anchors from revision metadata; verify that links still lead to the correct clinical section.')],
    'One coherent title and an unbroken parent-child outline match the source.',
    'A normal single H1 acts as the document wrapper; its H2 children become mobile chapter cards. Do not create extra H1 headings just to obtain more cards.', labels=['# Guideline title','  ## Chapter 1','    ### Major section','      #### Subsection','  ## Chapter 2'])

add('Upload and reconnect images',
    'Use Assets in the editor to manage version-scoped images and their attribution.', 'assets', [
    ('Gather the exact figures', 'Obtain the source images or extract them from the authoritative PDF. Check charts, axes, legends and labels. Do not substitute a similar chart when the required original is missing.'),
    ('Complete asset metadata', 'Open Assets > Guideline asset library. Choose, drop or paste images. Supported files are PNG, JPEG, GIF and WebP, up to 10 MB each. Provide meaningful alternative text; add caption, source, attribution and license as applicable.'),
    ('Insert the correct reference', 'Upload the image, inspect its preview and insert it where it belongs. Prefer the stable guideline-asset:// reference returned by the library. Resolve Broken references and ambiguous filenames before regeneration.'),
    ('Review clinical figures', 'Mark clinically sensitive figures appropriately. Review the asset and generated figure against the source. A figure is not ready for publication simply because its image loads.')],
    'Every intended image resolves to the correct version asset with meaningful alternative text.',
    'Replacing a clinical figure requires a fresh source check. Missing or unreviewed referenced assets can block publication.', labels=['Assets > Guideline asset library','Choose images','Alternative text / caption / source','Clinically sensitive figure','Insert stable reference'])

add('Repair and verify clinical tables',
    'Table formatting and clinical correctness are separate checks. Both must pass.', 'table', [
    ('Preserve the cell grid', 'Each Markdown table needs a header row, a separator row and an equal number of cells in every row. Keep empty leading or trailing cells and escape literal pipes inside cell text when needed.'),
    ('Use the visual table editor', 'Inspect the whole grid before adding, deleting or moving rows/columns. Preserve the source headings, merged-cell meaning, notes and reading order. Verify rendered output after each structural edit.'),
    ('Check every clinical detail', 'Compare headers, row associations, values, decimal points, units, age/weight groups, routes, intervals, footnotes, caption and source page. Never infer a missing dose or unit to make a table look complete.'),
    ('Save and regenerate', 'A valid table may still show high_risk_table_review_required. Save the source, regenerate, then approve the generated table individually in Editorial Review after source comparison.')],
    'The rendered grid is faithful to the authoritative table, including intentionally blank cells.',
    'Do not remove a row or warning merely to reach zero warnings. A syntactically valid table can still be clinically wrong.', labels=['Source table: compare every cell','Header A','Header B','Header C','Keep empty cells','Review footnotes and units'])

add('Prepare, save and checkpoint',
    'Save the exact source you intend to regenerate. Autosave and checkpoints are not publication actions.', 'save', [
    ('Inspect preparation proposals', 'Select Prepare for review. Review its before/after diff and Automatic, Editor review and Manual review categories. Apply only changes that preserve source meaning; preparation does not approve clinical content.'),
    ('Resolve blocking errors', 'Use the validation panel and source-line guidance to fix malformed tables, unsafe/unsupported markup, missing alternative text, broken links and invalid hierarchy. Warnings about tables and doses usually remain review obligations.'),
    ('Save the revision', 'Select Save draft and confirm the revision badge updates. Regenerate is disabled while changes are unsaved. A saved revision is immutable; saving newer source makes the previous structured projection outdated.'),
    ('Create a named milestone', 'For a substantial change, use Checkpoint and describe the change. If a conflict occurs, preserve/export your local work, load the current server revision and reconcile differences; do not overwrite another author blindly.')],
    'The intended source is saved on the server and has no regeneration-blocking errors.',
    'Local settings and local drafts are not a substitute for a confirmed server save. Do not regenerate from an older revision.', labels=['Prepare for review','Inspect proposed changes','Save draft','Revision updated','Checkpoint (optional)'])

add('Assign reviewers and record decisions',
    'Review & activity coordinates work and retains comments, assignments and the audit trail.', 'collaboration', [
    ('Assign responsibility', 'Open Review & activity > Reviewer assignments. Select an active clinical reviewer, optionally set a due date, then Assign reviewer. If the list is empty, ask an administrator to check active status and guideline.review access.'),
    ('Make requests traceable', 'Use comments to record source discrepancies, missing material and requested corrections. Refer to the version, revision, section or block and source page whenever available.'),
    ('Resolve collaboration work', 'Resolve or reopen comments as the source issue is checked. Refresh or poll to see others\' work; the editor does not provide guaranteed live cursors or realtime presence.'),
    ('Keep review separate', 'Completing an assignment or resolving a comment does not mark a block reviewed. High-risk blocks still need the explicit decision by an authorized reviewer, followed by regeneration acceptance and publication validation.')],
    'Reviewer responsibility and unresolved questions are visible and attributable.',
    'Do not place patient identifiers, passwords or unrelated personal information in review comments.', labels=['Review & activity','Reviewer assignments','Assign reviewer','Comments / resolve / reopen','Audit events'])

add('Regenerate the saved source',
    'Regeneration rebuilds the reader projection and search material from one immutable Markdown revision.', 'regen', [
    ('Start from the saved revision', 'Confirm Save draft completed and authoritative Markdown validation has no blocking errors. Select Regenerate in the toolbar (described as Regenerate structured content in some guides).'),
    ('Monitor the revision-bound job', 'Watch the stage and percentage until generation completes or requires review. Check that the job refers to the revision you intend to publish. Do not treat successful generation as clinical approval.'),
    ('Handle newer edits', 'If Regeneration stopped: newer revision appears, use Reload current revision, check the saved source and start a new regeneration. Retrying the superseded job is intentionally disabled.'),
    ('Handle a failure', 'Use Retry only when it is offered for the current eligible job and the cause is understood. Record a persistent error for operations. Review generated blocks again after regeneration; do not assume prior decisions were inherited.')],
    'A generated projection exists for the current saved revision, ready for review.',
    'If source changes after review begins, save, regenerate and repeat the review/acceptance cycle for the new revision.', labels=['Saved revision','Regenerate','Queued / running','Generated projection','Review required'])

add('Navigate Editorial Review',
    'Document > draft version > Editorial Review. The workspace opens at the first pending high-risk block.', 'review', [
    ('Understand the workspace', 'The left column is Sections; the middle is Source PDF or Reader preview; the right is the block list and selected block. Narrow screens use Sections / Source / Review block tabs.'),
    ('Choose the right filter', 'Pending review only targets outstanding individual decisions. All high-risk blocks includes approved safety-sensitive content. All blocks is essential for checking ordinary prose and surrounding context.'),
    ('Compare before deciding', 'Select a section and block, confirm its source page/provenance and compare the rendered output with the original. Use Review next pending to move through the queue.'),
    ('Use header controls', 'The progress bar summarizes individual review. The blockers button opens Publication checklist. Validate reruns publication checks. Progress and checklist counts can differ; the authoritative publication validator controls readiness.')],
    'You can locate the original source, rendered block and review status for the same section.',
    'No pending high-risk blocks does not prove that ordinary paragraphs, lists or entire sections have been reviewed.', labels=['Sections','Source PDF / Reader preview','Filter and block list','Approve & next','Reject','Publication checklist'])

add('Review ordinary content explicitly',
    'Approving tables alone can leave published chapters without their explanatory prose.', 'bulk', [
    ('Inspect the full content', 'Use All blocks to check paragraphs, headings, lists and references against the source. Verify that content is complete and in order, including front matter and appendices.'),
    ('Use the controlled low-risk queue', 'Open Bulk approve low-risk. Select only the eligible blocks you actually verified. The backend allowlist includes paragraphs, headings, ordered/unordered lists, references and page breaks.'),
    ('Attest deliberately', 'Review the selected content and counts. The operation allows at most 500 eligible blocks per submission. Confirm the attestation that every selected block was checked against the authoritative source, then Confirm approval.'),
    ('Verify the result', 'Confirm the selected blocks are reviewed. Repeat in sensible batches, then inspect the completeness report for reviewed prose and populated clinical leaf sections.')],
    'Reviewed ordinary content accompanies reviewed clinical tables and callouts.',
    'Figures, high-risk blocks, unknown types and types outside the allowlist cannot use this bulk approval. Selection is not permission to skip reading.', labels=['Bulk approve low-risk','Eligible blocks only','Selected content and type counts','Source-check attestation','Confirm approval'])

add('Approve high-risk content individually',
    'Each safety-sensitive decision must be deliberate, attributable and checked against the authoritative source.', 'highrisk', [
    ('Compare the complete clinical statement', 'Individually review tables, recommendations, warnings, cautions, contraindications, dosages, procedures, algorithms, algorithm references and referral criteria. Use the server policy and checklist for the actual required set.'),
    ('Review figures and conservative types', 'Compare clinically sensitive assets and figure blocks, including axes, legends and labels. Key points, evidence, definitions, clinical notes and unknown blocks are not automatically bulk-eligible; check the available authorized review action.'),
    ('Approve or reject', 'Select Approve & next (or Approve figure & next) only when faithful and correct. Reject when it must not publish; a rejected block remains outstanding until corrected and approved.'),
    ('Work efficiently without bypassing review', 'Outside text fields/dialogs, J moves next, K previous, A approves and advances, R rejects. Confirm the reviewed badge and decision trail. Save or discard an unsaved correction before deciding.')],
    'Every required high-risk block and relevant asset has an authorized approval.',
    'Do not bulk-approve clinical tables or accept the entire regeneration as a shortcut around individual review.', labels=['Compare source + rendered block','Check values, units and context','Approve & next','Badge: reviewed','Next pending block'])

add('Correct extraction and section defects',
    'Choose the correction method intentionally. Source fixes and structured corrections have different consequences.', 'correction', [
    ('Prefer a durable source correction', 'For missing wording, table cells, figure references or hierarchy problems, return to Edit Markdown. Correct against the source, save, regenerate and re-review the changed projection.'),
    ('Use a structured correction when appropriate', 'In Editorial Review, expand Correct extraction. Authorized users can edit the typed content type/payload and Save correction. This is an advanced content operation; request help rather than guessing JSON fields.'),
    ('Repair section navigation carefully', 'Use Section settings for title, level, slug, move or merge actions. Start new section here is available in the block menu. Check ordering, links and hierarchy afterward; deletion must not remove meaningful clinical content.'),
    ('Re-review the result', 'A saved block correction resets its decision to draft. Approve the corrected block only after rechecking it. Structured-only changes may be replaced by a later regeneration from Markdown, so reconcile the source for future editions.')],
    'The corrected source/projection remains faithful, structurally valid and reviewed.',
    'Never invent missing clinical values, source pages or attribution. Escalate missing source evidence.', labels=['Defect found','Edit Markdown > save > regenerate','OR: Correct extraction > Save correction','Decision resets to draft','Recheck and approve'])

add('Check the completeness report',
    'Editorial Review > Completeness report. This is a read-only readiness and coverage report, not an approval button.', 'complete', [
    ('Inspect coverage', 'Check total/reviewed sections and clinical leaf sections, empty leaves, block counts by type/state, reviewed percentage and reviewed paragraph coverage. Look for chapters with headings but no reviewed body.'),
    ('Compare with the current publication', 'Investigate unexpected reductions in chapters, sections, blocks, tables or high-risk blocks. A mostly empty candidate must not replace a complete published guideline just because some tables passed review.'),
    ('Check supporting evidence', 'Inspect original-PDF or offline-fallback availability, source revision/job identity, regeneration acceptance, validation issues and RAG chunks/embeddings. Confirm that expected images and source context are represented.'),
    ('Export and correct', 'Export JSON or CSV for audit when needed. Resolve missing content at the source or review the outstanding ordinary/high-risk blocks, then refresh the report. Exporting never approves or publishes anything.')],
    'Coverage is understood, no unexplained content loss remains, and the report refers to the intended revision/job.',
    'A high reviewed percentage alone is insufficient if a missing chapter or one critical table is concealed by the total.', labels=['Completeness report','Sections / leaf coverage','Blocks by type and state','Difference from current publication','RAG / fallback / revision identity','Export JSON / CSV'])

add('Accept the regenerated projection',
    'Return to the Markdown editor after individual and ordinary-content review is complete.', 'accept', [
    ('Open the regeneration comparison', 'Use Regeneration review when returning from Editorial Review, or open Edit Markdown for the draft. Inspect hierarchy, block-type counts, tables, chunks, assets, provenance and original-PDF availability.'),
    ('Refresh the approval status', 'Select Refresh approval status. If outstanding high-risk blocks remain, choose Review pending blocks, compare and approve the corrected content, then return and refresh again.'),
    ('Accept only the faithful result', 'When required review is complete and the comparison is satisfactory, select Accept regenerated projection. If it is not faithful, provide a rejection comment and choose Reject and return to Markdown.'),
    ('Protect the accepted identity', 'Acceptance applies to the exact generated revision/job. If the source is saved again or regenerated, the new result needs a new review and acceptance cycle. Do not publish an accepted older projection against newer source.')],
    'Regeneration review reads accepted for the current saved and generated revision.',
    'The acceptance button is refused while required high-risk blocks remain draft or rejected. No force-accept path is part of this SOP.', labels=['Regeneration review: pending','Compare output','Outstanding high-risk blocks: 0','Refresh approval status','Accept regenerated projection'])

add('Validate and publish the version',
    'The publisher performs the final gate. Publication makes the approved version current for reader-facing services.', 'publish', [
    ('Run authoritative validation', 'In Editorial Review select Validate and open Publication checklist. Resolve real defects and the review queue. The document page\'s Publish action also validates before attempting publication.'),
    ('Check every gate', 'Confirm source/generated/accepted revision identity, valid hierarchy and payloads, resolved/reviewed assets, approved required blocks, meaningful reviewed prose, adequate coverage, accepted regeneration and required source/offline fallbacks.'),
    ('Publish deliberately', 'Select Publish only after no blockers remain. Editorial Review asks for confirmation that publication is permanent and audited. Confirm only for the intended document/version. The backend rechecks eligibility.'),
    ('Confirm success and hand over', 'Check the success message and current published version on the document. The previous approved edition remains in history. Continue with website and mobile checks; guideline publication does not require a new application or website software release.')],
    'The intended edition is the current published version, not merely a saved draft or accepted regeneration.',
    'If Publication needs review / Publication blocked appears, return to the named issue. Do not create a software release to bypass a content-publication blocker.', labels=['Validate','Publication checklist','No blocking issues','Publish > confirm','Current published version'])

add('Verify the public website',
    'Use a public or signed-out view as well as the private dashboard preview.', 'website', [
    ('Find the published document', 'Open the public guidelines website and search for the official title. Check document kind, classification and visible version metadata. Confirm that a replacement shows the intended current edition.'),
    ('Check discovery and navigation', 'Open applicable category/disease listings and any configured hub placement. Test chapter navigation, nested sections, search terms, internal links and back navigation on desktop and narrow widths.'),
    ('Compare representative content', 'Check the first, middle and last chapters; review at least one table, clinical callout, figure and footnote where present. Confirm no empty clinical chapter has replaced complete reviewed content.'),
    ('Check downloads and citations', 'Open the original/download fallback where provided. Verify representative published search results and RAG citations resolve to the right document, current version and source context. Record missing results separately from reader defects.')],
    'A reader without dashboard access can find and read the expected approved version.',
    'A private preview is not a public acceptance test. Publication and client caches/indexing may not become visible at exactly the same instant.', labels=['Public guidelines website','Search by official title','Chapter / section navigation','Reviewed text, tables and figures','Current published edition'])

add('Verify the app and offline package',
    'Use a supported mobile build with connectivity first, then test the downloaded content offline.', 'mobile', [
    ('Refresh online discovery', 'Open the app online, refresh/synchronize available content and search for the title. Check relevant browse categories/diseases. If the new edition is absent, verify website/API publication before diagnosing the device.'),
    ('Open the structured reader', 'Confirm the edition and chapter list. Test nested sections, readable tables, figures, links, font scaling and narrow-screen layout. Compare representative safety-sensitive content with the source and public website.'),
    ('Download and reopen offline', 'Download or refresh the guideline package using the app\'s available download controls. After completion, disable connectivity and open the saved document. Test chapters, tables and images. Reconnect when the test is finished.'),
    ('Confirm update behavior', 'Existing downloads may need a refresh after a new edition publishes. Verify that the refreshed package represents the intended current version. Record device, app build, edition and synchronization time in the handover record.')],
    'The approved edition is discoverable online and its downloaded package works offline on a representative device.',
    'An old offline copy is not evidence that server publication failed. Offline or disconnected devices cannot receive immediate updates or withdrawal information.', labels=['1  Find online','2  Open chapters','3  Download / refresh','4  Reopen offline','5  Confirm edition'])

add('Notify readers after verification',
    'Notifications are an optional, separate approval workflow. They do not publish the guideline itself.', 'notify', [
    ('Complete reader checks first', 'Confirm that the intended version is published and works on the public website and app. Prepare a short factual change summary without overstating clinical changes.'),
    ('Create a draft campaign', 'On the document, use Notify users when available. Choose All eligible users or the intended user/role audience, change summary, priority, optional schedule and Push / In-app channels.'),
    ('Review before sending', 'Select Create draft campaign. The dialog explicitly creates a draft; it does not send directly. Open campaign to continue in Notification Operations for the normal review and approval process.'),
    ('Verify delivery responsibly', 'Confirm the target document/version and audience, then use the approved notification workflow. Test the deep link and inspect delivery outcomes. Notification permission/preferences and provider delivery affect reach.')],
    'If an announcement is needed, its approved campaign links to the verified published guideline.',
    'Do not describe a draft campaign as sent, or notification delivery as proof that content publication succeeded.', labels=['Notify users','Audience / change summary','Push / In-app / schedule','Create draft campaign','Notification Operations review'])

add('Update, withdraw or restore access',
    'Published clinical content is immutable. Corrections use a new edition; urgent removal uses withdrawal.', 'update', [
    ('Prepare a replacement edition', 'Open the published Markdown read-only view and choose the draft-from-published action. Enter a new unique version label. The immutable source is copied; regeneration does not run automatically. Correct, save, regenerate, review, accept, validate and publish.'),
    ('Withdraw unsafe public content', 'An authorized publisher can select Withdraw and record a reason. This removes the document from website, app discovery, search and AI retrieval while retaining files and history. Follow local incident communication procedures.'),
    ('Revise a withdrawn document', 'Choose Revise document or Continue draft. Use a new unique version label, check any omitted-content warnings and complete the full workflow. The document stays withdrawn while you work.'),
    ('Republish unchanged approved content', 'Review and republish runs publication checks for the approved edition. Review the withdrawal reason/history and attest readiness. If clinical wording must change, publish a new reviewed draft instead.')],
    'The public state matches the clinical decision, and the history explains the change.',
    'Downloaded copies are removed when devices next check online. Withdrawal cannot instantly reach a device that remains disconnected.', labels=['Published edition','Create new draft OR Withdraw','Edit and review replacement','Validate and publish','History retained'])

add('Special routes: forms and links',
    'Use these paths only for document kinds intentionally configured to publish an original file or external URL.', 'special', [
    ('Original-file route', 'Create document and version, then Upload file. Choose the correct PDF or Word (.docx), Upload source and wait for text indexing. Review form shows the file exactly as readers will receive it; use Preview original to check every relevant page.'),
    ('Publish an original file', 'Confirm readability, edition, source, metadata and the indexing result. Publish from the document page when checks pass. No Markdown, regeneration or structured-block editor is used for this route; a corrected file belongs in a new draft version.'),
    ('External-link route', 'Create document and version, choose Add link, enter the complete HTTPS URL and save. Review the actual destination, title, organization, availability and mobile behavior. No file extraction or Markdown workflow runs.'),
    ('Verify the reader result', 'Publish after required checks, then test the public website and app opening behavior. For links, content and access may change at the external host; for original files, verify the actual PDF/Word layout and download behavior.')],
    'Readers receive the intended reviewed original file or valid external destination.',
    'Do not promise offline availability or structured clinical page citations for an external link. Route-specific publication checks still apply.', labels=['Structured guideline: full workflow','Original file: upload > index > review > publish','External link: HTTPS > review > publish'])

add('Troubleshoot without losing work',
    'Fix the cause at the correct stage. Keep evidence and avoid duplicate uploads or unreviewed shortcuts.', 'troubleshoot', [
    ('Upload or processing stalls', 'Distinguish transfer progress from the processing job. Resume with the same file when eligible. For repeated failures, capture job/stage/attempt/error and ask operations to check storage, workers and embedding services.'),
    ('Regenerate is disabled or stale', 'Save unsaved changes and fix blocking Markdown errors. For a newer-revision warning, reload the current revision and regenerate it. Preserve local edits before resolving a server conflict.'),
    ('Review or publication is blocked', 'A high-risk table warning usually means individual review is still needed. Resolve missing image references, invalid typed payloads, rejected blocks, missing reviewed prose, empty leaves and unexplained coverage regressions. Refresh approval status before acceptance.'),
    ('Published content is absent', 'Verify the current published edition and withdrawal state, then test a signed-out website view and a refreshed online app. Check taxonomy/filter placement, synchronization, download age and search/index readiness. Escalate with document/version IDs and exact failing reader steps.')],
    'The issue has a reproducible cause, an owner and a safe next action.',
    'Never remove clinically meaningful content, invent missing evidence, bulk-approve high-risk blocks or republish a template to make a validator pass.', labels=['Identify stage','Preserve source and local edits','Capture exact error / IDs','Correct and repeat required gates','Re-test public readers'])

add('Publication handover checklist',
    'Use this checklist as the minimum operational record for an edition. Complete it before calling publication finished.', 'checklist', [
    ('Source and authorship', 'Record document title/ID, kind, version/ID, issuing organization, source filename and edition, source revision/checkpoint, author, reviewer and publisher. Record the changes made and any unresolved source questions.'),
    ('Review and readiness', 'Record the regenerated revision/job, completeness report export, ordinary-content review, individual high-risk/asset decisions, accepted regeneration and a passing publication validation. No unexplained content-loss or empty-clinical-section issue remains.'),
    ('Publication and reader checks', 'Record publication time, current edition, public URL, web test result, mobile build/device, online discovery result, downloaded edition and offline check. Include representative table, figure and RAG citation checks where applicable.'),
    ('Aftercare', 'Name the owner for defects, review-due date and withdrawal/escalation contact. Record the optional notification campaign separately. Keep audit exports in the organization\'s approved location; do not attach credentials or patient data.')],
    'Publication is complete when the correct reviewed edition is current and reader-facing verification is recorded.',
    'If verification fails, keep the issue open and assess withdrawal or a corrective edition under local governance.', lane='PUBLISHER + REVIEWER', labels=['Source checked','Review complete','Exact revision accepted','Validation passed','Web and app verified','Owner and evidence recorded'])

review_lanes = {
    'Navigate Editorial Review': 'REVIEWER',
    'Review ordinary content explicitly': 'REVIEWER',
    'Approve high-risk content individually': 'AUTHORIZED CLINICAL REVIEWER',
    'Correct extraction and section defects': 'EDITOR + REVIEWER',
    'Check the completeness report': 'REVIEWER + PUBLISHER',
    'Accept the regenerated projection': 'AUTHORIZED CLINICAL REVIEWER',
    'Validate and publish the version': 'PUBLISHER',
    'Verify the public website': 'PUBLISHER + READER TESTER',
    'Verify the app and offline package': 'PUBLISHER + READER TESTER',
    'Notify readers after verification': 'AUTHORIZED NOTIFICATION OPERATOR',
    'Update, withdraw or restore access': 'AUTHOR + REVIEWER + PUBLISHER',
    'Special routes: forms and links': 'AUTHOR + PUBLISHER',
    'Troubleshoot without losing work': 'ALL ROLES',
}
for page in pages:
    if page['title'] in review_lanes:
        page['lane'] = review_lanes[page['title']]

def f(size=32,bold=False): return ImageFont.truetype(BOLD if bold else FONT,size)
def multiline(draw, text, x, y, width, size=32, color=INK, bold=False, gap=9):
    font=f(size,bold); lines=[]
    for para in str(text).split('\n'):
        words=para.split(); line=''
        for word in words:
            test=(line+' '+word).strip()
            if draw.textlength(test,font=font)>width and line: lines.append(line); line=word
            else: line=test
        lines.append(line)
    for line in lines:
        draw.text((x,y),line,font=font,fill=color); y+=size+gap
    return y
def box(d,xy,fill='white',outline=LINE,r=18,width=3): d.rounded_rectangle(xy,r,fill=fill,outline=outline,width=width)
def button(d,text,x,y,w=330,fill=TEAL):
    box(d,(x,y,x+w,y+76),fill,fill,12)
    d.text((x+20,y+18),text,font=f(30,True),fill='white')
def arrow(d,x,y,vertical=False):
    if vertical:
        d.line((x,y,x,y+45), fill=TEAL,width=7); d.polygon([(x-12,y+28),(x+12,y+28),(x,y+48)],fill=TEAL)
    else:
        d.line((x,y,x+52,y), fill=TEAL,width=7); d.polygon([(x+34,y-12),(x+34,y+12),(x+56,y)],fill=TEAL)

def diagram(scene, labels, index):
    im=Image.new('RGB',(1800,760),'#F7FAFB'); d=ImageDraw.Draw(im)
    box(d,(2,2,1797,757),outline=LINE,r=24)
    d.rectangle((3,3,1796,93), fill=INK)
    d.text((34,25),'MEDIGUIDE  /  CLINICAL GUIDELINES',font=f(30,True),fill='white')
    d.text((34,706),'ILLUSTRATIVE SCREEN GUIDE - EXAMPLE DATA; NOT A LIVE SCREENSHOT',font=f(25),fill=MUTED)
    labels=labels or []
    if scene=='flow':
        names=['Create + upload','Edit + save','Regenerate','Review + accept','Publish + verify']
        for i,name in enumerate(names):
            x=40+i*350
            box(d,(x,208,x+305,438),fill='white')
            d.ellipse((x+110,235,x+190,315),fill=TEAL)
            d.text((x+136,251),str(i+1),font=f(34,True),fill='white')
            multiline(d,name,x+22,347,265,31,bold=True)
            if i<4: arrow(d,x+308,324)
        multiline(d,'Feedback loop: correct source > save > regenerate > review again',80,535,1600,34,color=TEAL,bold=True)
    elif scene in ('review','highrisk'):
        for x,w,title in [(30,380,'Sections'),(440,650,'Source PDF / Reader'),(1120,650,'Review block')]:
            box(d,(x,150,x+w,658)); d.text((x+22,175),title,font=f(33,True),fill=INK)
        for i,t in enumerate(['Chapter 1','  Section 1.1','  Section 1.2','Chapter 2']):
            box(d,(48,250+i*82,390,318+i*82),fill=LIGHT if i==1 else 'white',outline=LIGHT)
            d.text((65,268+i*82),t,font=f(29),fill=TEAL if i==1 else INK)
        d.rectangle((477,245,1053,593),fill='#EDF2F4',outline=LINE,width=3)
        multiline(d,'Authoritative source\n\nCompare wording, values,\nunits, tables and figures.',505,280,510,32)
        multiline(d,'Pending review only\n\nSelected block: draft\nSource page: verify',1147,250,590,31)
        button(d,'Approve & next',1145,555,325)
        box(d,(1490,555,1745,631),fill='white'); d.text((1520,575),'Reject',font=f(30,True),fill=INK)
    elif scene in ('editor','save','hierarchy','table'):
        for i,t in enumerate(['Edit | Split | Preview','Save draft','Regenerate']):
            x=[30,1080,1430][i]; w=[700,300,330][i]
            box(d,(x,118,x+w,185),fill=TEAL if i==1 else 'white')
            d.text((x+18,135),t,font=f(29,True),fill='white' if i==1 else INK)
        box(d,(30,218,870,620)); box(d,(900,218,1770,620))
        d.text((55,239),'Source Markdown',font=f(32,True),fill=INK)
        d.text((925,239),'Rendered preview / validation',font=f(32,True),fill=INK)
        text={'hierarchy':'# Guideline title\n## Chapter 1\n### Major section\n#### Subsection\n## Chapter 2','table':'| Header A | Header B |\n| --- | --- |\n| Source text |  |\n\nKeep all rows and footnotes.','save':'Review proposed diff\nPreserve source meaning\nSave the intended revision\n\nCheckpoint before major edits'}.get(scene,'# Training guideline\n## Chapter 1\nSource wording...\n\n[Image and table references]')
        multiline(d,text,60,310,765,33)
        multiline(d,'Check source fidelity\n\nErrors: correct before regeneration\nWarnings: inspect and review\n\nPrivate preview only',930,310,805,32)
        d.line((30,660,1765,660),fill=TEAL,width=5)
    elif scene in ('metadata','version'):
        d.text((42,120),'Create Guideline' if scene=='metadata' else 'Create first version',font=f(39,True),fill=INK)
        fields=labels[:-1]
        for i,label in enumerate(fields):
            col=i%2; row=i//2; x=45+col*870; y=202+row*130
            d.text((x,y),label,font=f(29,True),fill=INK)
            box(d,(x,y+42,x+810,y+103),fill='white')
        button(d,labels[-1],1300,602,450)
    elif scene=='mobile':
        names=['Find online','Read chapters','Download','Open offline']
        for i,name in enumerate(names):
            x=135+i*420
            box(d,(x,135,x+265,650),fill='white',outline=INK,r=35,width=5)
            box(d,(x+72,151,x+194,175),fill=INK,outline=INK,r=10)
            multiline(d,name,x+20,210,230,31,bold=True)
            for j in range(4): box(d,(x+20,305+j*61,x+245,345+j*61),fill=LIGHT,outline=LIGHT,r=6)
            d.ellipse((x+110,608,x+148,646),outline=INK,width=3)
            if i<3: arrow(d,x+284,400)
    elif scene in ('roles','routes','special'):
        specs={'roles':[('AUTHOR','Upload, edit and save\nRegenerate the draft'),('REVIEWER','Compare with source\nRecord explicit approvals'),('PUBLISHER','Validate the edition\nPublish and verify')], 'routes':[('STRUCTURED','PDF or Markdown\nFull review workflow'),('ORIGINAL FILE','PDF or Word\nReview file and publish'),('EXTERNAL LINK','Complete HTTPS URL\nReview destination')], 'special':[('STRUCTURED','Chapters and blocks\nEdit / regenerate / review'),('ORIGINAL FILE','Upload > index\nPreview > publish'),('EXTERNAL LINK','Save HTTPS URL\nReview > publish')]}[scene]
        for i,(title,body) in enumerate(specs):
            x=40+i*590; box(d,(x,190,x+540,600),fill='white')
            d.rectangle((x+1,192,x+538,275),fill=TEAL)
            d.text((x+24,215),title,font=f(33,True),fill='white')
            multiline(d,body,x+28,325,485,35)
    else:
        default={
          'processing':['Stored source','Extraction and OCR','Tables / images / blocks','Search and embeddings','Ready for editorial review'],
          'collaboration':['Review & activity','Assign reviewer','Record questions','Resolve / reopen comments','Check audit events'],
          'troubleshoot':['Identify stage and preserve work','Capture document / version / job IDs','Read the exact error','Correct the cause','Repeat review and validation'],
          'website':['Public guidelines website','Search the official title','Open chapters and nested sections','Inspect tables, figures and links','Confirm the published edition']}
        items=labels or default.get(scene, ['Check source','Review output','Confirm required state'])
        if len(items)>6:items=items[:6]
        for i,t in enumerate(items):
            col=0 if len(items)<=4 else i%2
            row=i if len(items)<=4 else i//2
            x=70+col*865; y=135+row*(128 if len(items)<=4 else 168)
            w=1660 if len(items)<=4 else 795
            box(d,(x,y,x+w,y+108),fill='white')
            d.ellipse((x+20,y+23,x+80,y+83),fill=TEAL)
            d.text((x+40,y+33),str(i+1),font=f(30,True),fill='white')
            multiline(d,t,x+105,y+20,w-135,32,bold=True)
    path=WORK/'images'/f'{index:02d}-{scene}.png'; im.save(path); return path

W,H=595.276,841.89
M=42; CW=W-2*M
styles={
 'body':ParagraphStyle('body',fontName='Arial',fontSize=10.2,leading=14.6,textColor=HexColor(INK)),
 'intro':ParagraphStyle('intro',fontName='Arial',fontSize=11,leading=15.5,textColor=HexColor(MUTED)),
 'title':ParagraphStyle('title',fontName='ArialBold',fontSize=25,leading=28.5,textColor=HexColor(INK)),
 'small':ParagraphStyle('small',fontName='Arial',fontSize=8.3,leading=11.2,textColor=HexColor(MUTED)),
 'gate':ParagraphStyle('gate',fontName='Arial',fontSize=10,leading=14,textColor=HexColor(INK)),
}
layout=[]
def para(c,text,y,style='body',x=M,width=CW):
    p=Paragraph(text,styles[style]); w,h=p.wrap(width,H); p.drawOn(c,x,y-h)
    return y-h
def frame(c,n,total,label):
    c.setFillColor(HexColor(TEAL)); c.rect(0,H-12,W,12,fill=1,stroke=0)
    c.setFillColor(HexColor(INK)); c.setFont('ArialBold',9)
    c.drawString(M,H-39,'MEDIGUIDE  |  CLINICAL GUIDELINES')
    c.setFillColor(HexColor(MUTED)); c.setFont('Arial',8)
    c.drawRightString(W-M,H-39,'SOP-CG-01  /  Version 1.0')
    c.setStrokeColor(HexColor(LINE)); c.line(M,47,W-M,47)
    c.setFont('Arial',8); c.drawString(M,31,'25 October 2026  |  Based on MediGuide v2.1.23')
    c.drawRightString(W-M,31,f'{n:02d} / {total:02d}')
    c.bookmarkPage(f'page{n}'); c.addOutlineEntry(label,f'page{n}',level=0)
def callout(c,label,text,y,warning=False):
    color='#FFF5E6' if warning else '#EAF5F3'
    p=Paragraph('<b>'+escape(label)+'</b> '+escape(text),styles['gate'])
    _,h=p.wrap(CW-26,H)
    c.setFillColor(HexColor(color)); c.roundRect(M,y-h-20,CW,h+20,6,fill=1,stroke=0)
    p.drawOn(c,M+13,y-h-10)
    return y-h-28

def build():
    total=len(pages)+2
    c=canvas.Canvas(str(OUT),pagesize=(W,H),pageCompression=1)
    c.setTitle('MediGuide Clinical Guidelines - Illustrated Dashboard SOP')
    c.setAuthor('MediGuide project - operational documentation')
    c.setSubject('Upload, editing, regeneration, clinical review, publication, website and mobile verification')
    frame(c,1,total,'Cover')
    y=H-92
    c.setFont('ArialBold',11);c.setFillColor(HexColor(TEAL));c.drawString(M,y,'ILLUSTRATED STANDARD OPERATING PROCEDURE')
    y-=28
    y=para(c,'Clinical guidelines:<br/>from source to published readers',y,'title')-18
    y=para(c,'A complete dashboard guide for authors, clinical reviewers and publishers.',y,'intro')-24
    img=diagram('flow',None,0);c.drawImage(str(img),M,y-215,width=CW,height=215);y-=238
    y=para(c,'<b>Includes:</b> upload and resume; Markdown editing; figures and tables; revision control; regeneration; individual and low-risk review; completeness; acceptance; publication; website and mobile/offline checks; notifications; updates and withdrawal.',y)-18
    y=callout(c,'Image note.', 'All images in this guide are illustrative screen guides reconstructed from the implemented dashboard controls. They are not live screenshots. Example records contain no clinical dosing content.',y)
    y=para(c,'<b>Document control</b><br/>SOP-CG-01 | Version 1.0 | Prepared 25 October 2026<br/>Implementation baseline: v2.1.23, commit 2cd566c4.<br/>Operational guide for local approval. This document does not grant clinical approval, publishing permissions or organizational sign-off.',y,'small')
    layout.append((1,y));c.showPage()
    for i,p in enumerate(pages,2):
        frame(c,i,total,p['title'])
        y=H-75
        c.setFillColor(HexColor(TEAL));c.setFont('ArialBold',9)
        c.drawString(M,y,f"{i-1:02d}  /  {p['lane']}")
        y-=14
        y=para(c,escape(p['title']),y,'title')-9
        y=para(c,escape(p['intro']),y,'intro')-14
        img=diagram(p['scene'],p['labels'],i)
        height=CW*760/1800
        c.drawImage(str(img),M,y-height,width=CW,height=height);y-=height+15
        for j,(head,body) in enumerate(p['steps'],1):
            y=para(c,f'<b>{j}. {escape(head)}.</b> {escape(body)}',y)-8
        y=callout(c,'Expected result.',p['gate'],y-1)
        if p['caution']: y=para(c,'<b>Watch point:</b> '+escape(p['caution']),y,'small')
        layout.append((i,y))
        if y<58: raise ValueError(f'Page {i} overflow: {y:.1f}, {p["title"]}')
        c.showPage()
    n=total;frame(c,n,total,'References and control notes');y=H-80
    y=para(c,'References and control notes',y,'title')-14
    y=para(c,'This SOP consolidates existing repository guides and checks the control labels against the implemented dashboard. It describes the source-to-publication lifecycle; it does not approve any particular guideline.',y,'intro')-20
    refs=[
      ('Full authoring lifecycle','docs/guideline-authoring-and-publication-workflow.md'),
      ('Editorial Review layout and shortcuts','docs/guideline-editorial-review-workspace.md'),
      ('Role and permission boundaries','docs/guideline-editor-permissions.md'),
      ('Warning interpretation and remedies','docs/guideline-warning-resolution.md'),
      ('Validation failures and recovery','docs/guideline-validation-troubleshooting.md'),
      ('Content-kind alternatives','docs/content-hub-and-document-publishing-workflow.md'),
      ('Creation, detail and version dialogs','dashboard/app/(dashboard)/guidelines/'),
      ('Markdown, asset library and review controls','dashboard/components/guidelines/'),
      ('Authoritative block policy','backend/internal/models/guideline_block_review_policy.go'),
    ]
    for title,path in refs:
        y=para(c,f'<b>{escape(title)}</b>',y)-2
        y=para(c,escape(path),y,'small')-12
    y=callout(c,'Maintain this SOP.', 'Recheck the workflow after changes to the authoring editor, review policy, publication validator, document kinds or public/mobile readers. Replace illustrative images with authorized screenshots when a suitable training session is available.',y-6)
    y=para(c,'<b>Local ownership record</b><br/>SOP owner: ____________________<br/>Clinical governance approver: ____________________<br/>Operational approval date: ____________________<br/>Next review date: ____________________',y)-10
    layout.append((n,y));c.showPage();c.save()
    reader=PdfReader(str(OUT))
    assert len(reader.pages)==total,(len(reader.pages),total)
    alltext='\n'.join(p.extract_text() for p in reader.pages)
    normalized=' '.join(alltext.split())
    for phrase in ['Accept regenerated projection','Clinical Guidelines','Completeness report','Resume upload','offline','Withdraw','Publication checklist']:
        assert phrase in normalized,phrase
    (WORK/'layout.json').write_text(json.dumps(layout,indent=2))
    (WORK/'text.txt').write_text(alltext)
    print(json.dumps({'output':str(OUT),'pages':total,'images':len(list((WORK/'images').glob('*.png'))),'min_content_y':min(y for _,y in layout),'bytes':OUT.stat().st_size},indent=2))

if __name__=='__main__': build()
