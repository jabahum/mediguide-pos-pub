from pathlib import Path
from html import escape
import importlib.util,json,re,io
from PIL import Image,ImageDraw,ImageFont
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor,white
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader
ROOT=Path('/Users/jaba/Documents/projects/web/mediguide-pos')
WORK=ROOT/'tmp/pdfs/guidelines-sop-v2'; RAW=WORK/'screenshots/raw'; OUT=ROOT/'output/pdf/mediguide-clinical-guidelines-dashboard-sop.pdf'
spec=importlib.util.spec_from_file_location('old',ROOT/'tmp/pdfs/guidelines-sop/build_sop.py');old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old)
INK='#132D3B';TEAL='#087E83';MUTED='#526875';LIGHT='#EEF5F6';LINE='#D5E2E6'
styles={k:ParagraphStyle(k,fontName='ArialBold' if k in ['title','sub'] else 'Arial',fontSize=s,leading=l,textColor=HexColor(INK),spaceAfter=0) for k,s,l in [('title',25,29),('intro',12,17),('body',11,15.5),('small',9,12.5),('sub',13,17),('caption',10,13)]}
C=None; PN=0; layout=[]; toc=[]; manifest=[]
def para(text,y,w=499,x=48,kind='body'):
 p=Paragraph(text.replace('\n','<br/>'),styles[kind]);_,h=p.wrap(w,2000);p.drawOn(C,x,y-h);return y-h

def frame(title,land=False,lane='PROCEDURE'):
 global PN
 PN+=1;W,H=(842,595) if land else (595,842);C.setPageSize((W,H));C.setFillColor(white);C.rect(0,0,W,H,fill=1,stroke=0)
 C.setFillColor(HexColor(TEAL));C.rect(0,H-9,W,9,fill=1,stroke=0)
 C.setFont('ArialBold',9);C.drawString(40,H-32,'MEDIGUIDE  /  CLINICAL GUIDELINES');C.setFont('Arial',8);C.drawRightString(W-40,H-32,lane)
 C.setStrokeColor(HexColor(LINE));C.line(40,37,W-40,37);C.setFont('Arial',8);C.setFillColor(HexColor(MUTED));C.drawString(40,23,'SOP v2.0  •  25 October 2026  •  Actual UI screenshots');C.drawRightString(W-40,23,str(PN))
 key='p'+str(PN);C.bookmarkPage(key);C.addOutlineEntry(title,key,level=0,closed=False)
 return W,H

def end(y=60):
 layout.append({'page':PN,'bottom':y});assert y>=48,(PN,y);C.showPage()

def note(title,text,y,w=499,x=48):
 p=Paragraph('<b>'+escape(title)+'</b><br/>'+escape(text),styles['small']);_,h=p.wrap(w-24,1000);C.setFillColor(HexColor(LIGHT));C.roundRect(x,y-h-22,w,h+22,7,fill=1,stroke=0);p.drawOn(C,x+12,y-h-11);return y-h-32

def img(file,box,crop=None):
 im=Image.open(file).convert('RGB');im=im.crop(crop) if crop else im
 x,y,w,h=box;scale=min(w/im.width,h/im.height);iw,ih=im.width*scale,im.height*scale
 buf=io.BytesIO(); im.save(buf,format='JPEG',quality=92,optimize=True);buf.seek(0)
 C.drawImage(ImageReader(buf),x+(w-iw)/2,y+(h-ih)/2,iw,ih,mask='auto');return im

def raw(n):return next(RAW.glob(f'{n:02d}-*.png'))
# Each screen has an exact location, visible landmarks, and an honest interpretation of its state.
screens={
1:('Guidelines library','Clinical Guidelines > All Guidelines','Find the intended document before choosing a version. The list is a read-only production capture; all subsequent authoring examples use localhost.',(510,250,4112,2160)),
3:('The four-stage creation wizard','Clinical Guidelines > Create Guideline','The stages are Create guideline, Create version, Upload version, and Review and edit. Document kind determines the authoring route.',(550,520,4050,2180)),
4:('Completed document metadata','Create guideline stage','Read each field before Create and Continue. The TRAINING ONLY title and non-clinical description identify this local example.',(550,520,4050,2180)),
5:('Create the edition','Create version stage','Version label identifies the document edition. Publication date and Review date do not publish or schedule the version.',(550,520,4050,1160)),
6:('Choose the source route','Upload version stage','Choose a PDF or Markdown source; the alternatives are Start with blank Markdown and Start from template.',(550,520,4050,1520)),
7:('Source selected, before transfer','Upload version stage','Verify the selected filename, target document and edition, then Upload source. Selecting the file alone does not transfer it.',(550,520,4050,1520)),
8:('Transfer complete; processing queued','Source transfer and processing','The queued job is a separate step after file transfer. Do not leave with the assumption that the reader content is already reviewed.',(550,700,4050,1950)),
9:('Completed extraction stages','Source transfer and processing','This small training PDF completed quickly. Stage rows show their actual completion states; duration varies for real documents.',(550,600,4050,1990)),
10:('Ready to author','Review and edit stage','Use Open Markdown workspace after the source is available. A green processing bar is readiness for editing, not public release.',(550,300,4050,2260)),
11:('Version-level actions','Document detail > Versions','Check the version row before Upload PDF, Preview original, View Content, Edit Markdown or Editorial Review.',(550,880,4050,1430)),
12:('Extraction defects are visible','Edit Markdown > Split','The extracted H1 says Introduction instead of the document title, and headings repeat. Use validation plus the authoritative PDF to correct structure.',(550,500,4050,2050)),
13:('Corrected heading hierarchy','Edit Markdown > Split','One H1 matches the record title; two H2 chapters preserve source order. The warning about a table still requires editorial review.',(550,450,4050,1950)),
14:('Prepare for review is a proposal','Prepare for review dialog','The dialog has Automatic, Editor review and Manual review categories. This example proposes no changes; no clinical approval is performed.',(880,770,3220,1430)),
15:('Version asset library','Assets > Guideline asset library','An extracted asset is already present. Inspect it before uploading or inserting any replacement.',(880,500,3220,2140)),
16:('Image metadata before upload','Assets > Upload panel','The figure file, alternative text and caption are filled in. Review source, attribution and license where applicable; flag clinical sensitivity accurately.',(880,150,3220,2150)),
17:('Uploaded image ready to insert','Guideline asset library','Inspect the preview and metadata, then Insert beside the intended asset. The editor inserts a stable guideline-asset reference.',(880,450,3220,2150)),
18:('Saved source with stable image reference','Edit Markdown > Split','The new guideline-asset reference is part of the saved source. Saving it does not regenerate or approve the structured figure.',(550,200,4050,2200)),
19:('Reviewer coordination and audit','Review & activity','Reviewer assignments, comments and Activity log live here. An assignment or resolved comment is separate from a block decision.',(1150,650,2950,1830)),
20:('Immutable revision history','History > Markdown revision history','Rows identify revision numbers, source and time. Use Preview or Compare before deciding to restore an earlier source.',(880,650,3220,1770)),
21:('Compare source revisions','History > Compare','This actual diff compares extraction revision 1 with corrected revision 2. Red is removed source; green is added source. A diff does not establish clinical correctness.',(880,400,3220,2090)),
22:('Visual Markdown table editor','Formatting toolbar > Table','This is a newly composed example table: title, caption, source, headers, row and footnote controls. It was canceled rather than applied to the training source.',(880,230,3220,2210)),
23:('Generated, pending review','Regenerate > regeneration comparison','Generation completed for revision 3. Acceptance remains disabled until the required blocks are reviewed. Comparison counts need confirmation in the actual rendered output.',(550,250,4050,2220)),
24:('Source PDF beside the table','Editorial Review > Review','Sections are on the left, original PDF in the middle, rendered block and actions on the right. The table content can be compared cell by cell.',(2660,530,4080,2300)),
25:('Publication blockers grouped by issue','Header > blockers > Publication checklist','This snapshot shows missing reviewed prose and one pending table. Use Go to issue or Start reviewing; do not remove content just to clear a blocker.',(2690,330,3540,1140)),
26:('Controlled low-risk queue','Editorial Review > Bulk approve low-risk','Seven eligible blocks are pending: three headings and four paragraphs. Filters and selection controls allow a deliberate, source-checked batch.',(550,530,4050,2150)),
27:('Approval requires a source attestation','Approve selected low-risk blocks','The dialog states the selected type counts and exact-revision attestation. Check the box only after verifying every selected block.',(1550,910,2570,1480)),
28:('Individual figure review','Editorial Review > Review','Approving a figure also approves its linked asset. Compare the exact image, caption, alternative text and any source/license information.',(2660,530,4080,2300)),
29:('Completeness after review','Editorial Review > Completeness report','The training example has 9/9 reviewed blocks, 100% coverage, 2/2 reviewed leaves, zero empty leaves, and all publication gates passing.',(550,530,4050,1640)),
30:('Acceptance becomes available','Edit Markdown > Regeneration review','After returning from review, Accept regenerated projection is enabled. Confirm that the comparison still describes the intended saved revision.',(550,900,4050,2250)),
35:('Mobile width table preview','Editorial Review > Reader preview > Mobile preview','This is the real dashboard preview at mobile width. It is useful for layout inspection; it is not an on-device app acceptance test.',(1400,590,2320,1880)),
36:('Mobile width figure preview','Reader preview > Mobile preview','Check the entire image and caption at narrow width, then inspect equivalent content in the supported app build.',(1400,590,2320,1920)),
37:('Regeneration accepted','Edit Markdown > Regeneration review','The visible state reads accepted and Current structured source approved. This is still a private draft until a publisher publishes it.',(550,500,4050,1450)),
38:('A genuinely published version','Document detail > Versions','This is an existing local reader fixture, Local test - Guideline, version 1.0 published. It is a separate record from the training walkthrough draft.',(550,250,4050,1600)),
32:('Public guidelines website','Public website > Guidelines','The library exposes published documents to readers. Search by official title and inspect the version rather than relying on a private dashboard preview.',(850,1500,3350,2300)),
33:('Published structured reader','Public library > Read guideline','This existing published fixture exposes chapter navigation, source-page actions and a structured table. It is not the newly reviewed training draft.',(900,200,3030,2190)),
34:('Reader navigation reaches the table','Public reader > Sample workflow','The chapter action changes the URL anchor and scroll position. Verify ordered lists, table headers and cells, then the final chapter.',(900,500,3030,2190)),
}
# Screens beside the corresponding narrative procedure; all images remain screenshots, with no reconstructed UI.
assign={0:[1],2:[3],3:[4],4:[5],5:[6,7],6:[8,9,10],7:[11,12],8:[13],9:[15,16,17],10:[22],11:[14,18,20,21],12:[19],13:[23],14:[24,25],15:[26,27],16:[28],17:[],18:[29],19:[30,37],20:[38],21:[32,33,34],22:[35,36]}
extras={
3:[('Field-by-field check','Title: exact official source title. Document kind: choose the intended structured/original/link route. Legacy program area: optional where shown. Source organization: issuing body, not an author signature. Country and language: match the document. Categories/diseases: select relevant taxonomy entries; Primary disease comes from selected diseases. Description: a short accurate summary.'),('After Create and Continue','The record is saved and Create version becomes active. If validation fails, stay on this form and correct the named field; do not create a second record to retry.')],
4:[('Record the edition','Use a unique label such as the issuing body’s edition or year/revision. Confirm dates against the source. The software build number and the guideline edition are different identifiers.')],
5:[('Before Upload source','Confirm the selected filename appears in the upload panel. Removing or replacing a selected file before transfer is different from replacing an already published edition. Keep the authoritative source in the approved document archive.')],
7:[('What each editor control does','Edit changes source; Split shows source and render together; Preview shows output. History compares immutable saved revisions. Assets manages figure files. Review & activity coordinates reviewers. Compare regenerated evaluates a generated projection. None of these controls publishes by itself.')],
8:[('Worked correction in the screenshots','Extraction produced “# Introduction” and repeated section labels. The demonstration replaces them with one exact document H1 and two source-matching H2 chapters. The table and the full prose are preserved. Real clinical corrections require source evidence.')],
9:[('Placement and reference check','Put the insertion cursor at the intended location before Insert. Confirm the Markdown contains the intended guideline-asset:// reference and that the rendered preview loads the same figure. Remove accidental duplicate references only after checking context.')],
10:[('Table dialog controls','Title describes the table; Caption preserves explanatory context; Source records provenance. Set each header and its alignment, then add or remove rows/columns only as required by the source. CSV controls affect the grid; Footnotes retain qualifying notes. Inspect Preview before Update Markdown table. Cancel abandons the proposed table edit.')],
11:[('Practical save sequence','After typing, wait for All changes saved or use Save draft when enabled. Read the revision number. Create a meaningful Checkpoint before a large change when the control is available. Use History to compare the relevant revisions; restoration creates a new source state that needs fresh regeneration and review.')],
13:[('Read the comparison critically','The training comparison’s legacy table counter says after 0, while the actual structured Review and Completeness report contain one reviewed table. Counts alone are insufficient evidence of loss or completeness. Compare the real sections/blocks, report and source; investigate any unexplained mismatch before publishing.')],
14:[('If the tab strip is covered','In this capture session the sticky header overlapped the Review / Bulk approve low-risk / Completeness report strip. Use keyboard Tab or Shift+Tab until the selected tab receives focus, then Left/Right to choose the tab and Enter if needed. This navigates the existing UI without skipping any review gate.')],
15:[('Reproduce this batch','Set Risk to low risk pending and inspect the other filters. Read the eligible content against the source. Select visible low-risk blocks only for that verified set. Inspect the selected count before Approve selected low-risk blocks. In the dialog check the type totals, attest source fidelity, and Confirm approval. Verify Reviewed increases and Pending low risk decreases.')],
16:[('Worked individual decisions','The training table has two columns and three data rows, all compared with PDF page 1. The training figure is a separate non-clinical editorial illustration added by the author; verify its original image and metadata, not a fictitious PDF page. The example’s figure has no PDF page provenance, shown as p.—.')],
18:[('Read the actual evidence','In this walkthrough, the report shows heading 3 reviewed, paragraph 4 reviewed, table 1 reviewed and figure 1 reviewed. Those counts fit this tiny two-chapter fixture only. For a real guideline reconcile the report with every source chapter and appendix.')],
19:[('Accepted does not mean published','The screenshot says Regeneration review: accepted and Current structured source approved. The version can still show review_required until publication. Use the authoritative checklist and published-version state rather than interpreting one badge in isolation.')],
20:[('Exact confirmation wording','Editorial Review asks: “Publish this reviewed version? The action is permanent and audited.” The authorized publisher checks the document and version, then confirms. The training walkthrough was stopped at this confirmation; the published-state screenshot is an already published local fixture. No production publication was performed for this SOP.')],
21:[('Exact website controls','Use Search publications, Program area and Document kind in the public library. Choose Read guideline on the intended card. In the reader use Search sections, chapter buttons, Change text size and source-page controls. Verify the edition displayed beside the source organization.')],
22:[('Evidence boundary','The dashboard screenshots are exact mobile-width previews of the training draft. The additional Android screenshots are existing repository/store screenshots of another guideline. This SOP provides the on-device acceptance steps; it does not claim that the training draft was published or verified offline on a device.')],
}

def clean(s):
 s=re.sub(r'See pages [0-9-]+\.?','See the corresponding procedure and screen plates.',s)
 s=re.sub(r'in pages [0-9-]+','in the following procedures',s)
 s=s.replace('pages 5-24','the structured workflow').replace('page 27','the special-routes procedure').replace('follow on pages 25-29','follow in procedures 24-28')
 return s

def procedure(i,p):
 frame(p['title'],lane=p['lane']);toc.append((p['title'],PN));y=para(f'{i+1:02d}  '+escape(p['title']),786,kind='title')-12
 y=para(escape(clean(p['intro'])),y,kind='intro')-22
 for j,(a,b) in enumerate(p['steps'],1):
  y=para(f'{j}. '+escape(a),y,kind='sub')-5;y=para(escape(clean(b)),y)-16
 y=note('Continue when',p['gate'],y-2)
 if p['caution']:y=para('<b>Watch point:</b> '+escape(p['caution']),y,kind='small')-14
 refs=assign.get(i,[])
 if refs:y=para('<b>Screen plates follow:</b> '+escape('; '.join(screens[n][0] for n in refs)),y,kind='small')-14
 fitted=False
 if i in extras:
  needed=0
  for a,b in extras[i]:
   for txt,kind in [(a,'sub'),(b,'small')]:
    q=Paragraph(escape(txt),styles[kind]);needed+=q.wrap(499,2000)[1]+8
  if y-needed>=57:
   for a,b in extras[i]:y=para(escape(a),y,kind='sub')-6;y=para(escape(b),y,kind='small')-10
   fitted=True
 end(y)
 if i in extras and not fitted:
  frame(p['title']+' — operating detail',lane='FIELD GUIDE');y=para('Operating detail',786,kind='title')-10;y=para(escape(p['title']),y,kind='intro')-22
  for a,b in extras[i]:y=para(escape(a),y,kind='sub')-7;y=para(escape(b),y)-22
  # Action vocabulary reinforces real controls without recreating a screen.
  if i in [7,11,13,19]:
   y=note('State sequence','Source saved → regeneration completed → blocks reviewed → exact projection accepted → validation passed → version published → web and app verified.',y)
  y=note('Evidence to retain','Record document and version, source revision, responsible person, time, expected result and any unresolved defect. Use the handover checklist at the end.',y)
  end(y)

def plate(n):
 title,route,caption,crop=screens[n];frame(title,True,'ACTUAL SCREEN  /  '+('PRODUCTION READ-ONLY' if n==1 else 'LOCAL DEMONSTRATION'))
 para(escape(title),548,762,40,'title');para(escape(route),514,762,40,'small')
 # Preserve the full high-resolution screen. Crop only outer browser chrome and sidebar when the UI is modal.
 im=Image.open(raw(n));modal=n in [14,15,16,17,19,20,21,22,27]
 bounds=crop if modal else ((510,200,4112,2310) if n not in [1,32,33,34] else ((510,170,4112,2300) if n==1 else (600,0,3600,2300)))
 img(raw(n),(40,103,762,398),bounds)
 para(escape(caption),93,762,40,'caption');end(50)
 manifest.append({'id':n,'file':raw(n).name,'pdf_page':PN,'caption':caption,'crop':bounds})
 # Additional enlarged control panel; no redraw or synthesized controls.
 if n in [4,5,11,12,13,16,17,18,22,23,24,25,26,28,29,30,35,36,37,38]:
  frame(title+' — close-up',True,'ACTUAL SCREEN  /  ENLARGED DETAIL');para(escape(title)+' — close-up',548,762,40,'title')
  img(raw(n),(40,105,762,398),crop)
  para(escape(caption),93,762,40,'caption');end(50)
  manifest.append({'id':n,'file':raw(n).name,'pdf_page':PN,'caption':caption,'crop':crop,'detail':True})

def textpage(title,sections,lane='REFERENCE'):
 frame(title,lane=lane);y=para(escape(title),786,kind='title')-20
 for a,b in sections:y=para(escape(a),y,kind='sub')-6;y=para(escape(b),y)-20
 end(y)

OUT.parent.mkdir(parents=True,exist_ok=True);C=canvas.Canvas(str(OUT));C.setTitle('MediGuide Clinical Guidelines — Exact Screen Workflow SOP');C.setAuthor('MediGuide operational documentation');C.setSubject('Upload, author, regenerate, review, publish and verify')
frame('Clinical Guidelines — operational SOP',lane='VERSION 2.0');y=para('Clinical Guidelines',760,kind='title')-8;y=para('The complete dashboard workflow',y,kind='title')-24
y=para('Upload → edit → regenerate → review → accept → publish → verify website and app',y,kind='intro')-27
img(raw(24),(48,300,499,270),(510,250,4112,2250))
y=note('What changed in this edition','Real dashboard screenshots replace the earlier reconstructed diagrams. Procedures, operating details, full screen plates and enlarged panels show the actual controls and review states.',279)
y=para('For authors, clinical reviewers, publishers and reader testers. Prepared 25 October 2026. Training content is clearly marked and contains no clinical recommendations.',y,kind='body')-18
y=para('<b>Controlled document:</b> Operational reference pending the organization’s clinical governance approval. Assign a local owner and review after material dashboard changes.',y,kind='small');end(y)
textpage('How to use this guide',[
 ('Follow the procedure, then its screen plates','Each numbered procedure states the starting point, actions, expected result and a watch point. Screen plates immediately afterward show the real interface. Enlarged details preserve small labels. PDF bookmarks provide direct navigation.'),
 ('Know which environment is shown','The first library image is a read-only production capture. Authoring screens use the locally running dashboard with a non-clinical TRAINING ONLY document, version SOP-2026.1. The public reader and published-state plates use a separate existing local fixture.'),
 ('What this walkthrough actually reached','The two-page training source was uploaded, corrected, saved through revision 3, regenerated, individually and bulk reviewed, and accepted. Completeness reported 9/9 reviewed blocks and all publication gates passing. The final Publish confirmation was inspected and canceled. No production clinical records were changed.'),
 ('Understand the mobile evidence','Dashboard mobile previews are labeled as previews. Android app plates come from the repository’s real store screenshot assets and show a different guideline. On-device publication, synchronization and offline checks remain required for each real edition.'),
 ('Use the expected result as a gate','Stop and investigate a mismatch between source, actual rendered content, report or target edition. Screen counts and layout vary with document size, permissions and software version. Training counts are examples, never a substitute for full review.')])
textpage('Find the stage you need',[
 ('Create and upload','Procedures 01–07: lifecycle, people and access, document route, metadata, edition, source upload, extraction and indexing.'),
 ('Author and regenerate','Procedures 08–14: Markdown workspace, headings, images, tables, preparation and saving, collaboration, revision-bound regeneration.'),
 ('Review and accept','Procedures 15–20: editorial layout, ordinary-content review, individual decisions, corrections, completeness, acceptance.'),
 ('Publish and verify','Procedures 21–24: validation and publication, public website, mobile/offline verification, optional notifications.'),
 ('Aftercare and exceptions','Procedures 25–28: update/withdrawal, original-file/link routes, troubleshooting, publication handover.'),
 ('Navigation tip','Use the PDF bookmarks or search for an exact control label such as Prepare for review, Completeness report or Accept regenerated projection. Every screen plate is named in its related procedure.')])
for i,p in enumerate(old.pages):
 procedure(i,p)
 for n in assign.get(i,[]):plate(n)
 if i==22:
  for name,title in [('05-guideline-overview.png','Android app — guideline overview'),('06-guideline-chapters.png','Android app — chapters and download')]:
   frame(title,True,'ACTUAL APP SCREENSHOT  /  REPOSITORY ASSET');para(title,548,762,40,'title');f=ROOT/'user_app/fastlane/metadata/android/en-US/images/phoneScreenshots'/name;img(f,(45,75,250,430))
   y=para('What to check on the device',490,450,330,'sub')-14
   items=[('Confirm the edition','Match the title, issuing body, version/date and reviewed structured content badge with the approved current publication.'),('Navigate the content','Open Chapters, use Search chapters and content, and select representative chapters. Use Read guideline and inspect the full content, including tables and figures.'),('Verify downloads','The bottom download icon is visible in these app screens. Complete the download, then open the saved guideline with connectivity disabled. Check the edition and images, reconnect, and record the result.'),('Scope of this image','This is an existing Android store screenshot for the Antimicrobial Resistance plan, not a live test of the local training draft. These screenshots do not prove an offline package test passed.')]
   for a,b in items:y=para(escape(a),y,450,330,'sub')-4;y=para(escape(b),y,450,330,'body')-14
   end(y)
textpage('Final acceptance record',[
 ('Document and source','Title/ID: ____________________  Version/ID: ____________________\nIssuing body/source filename: ____________________\nSaved revision and regeneration job: ____________________'),
 ('Review evidence','Author: ____________________  Authorized reviewer: ____________________\nOrdinary prose reviewed: ____  Required individual decisions complete: ____\nCompleteness export: ____________________  Acceptance time: ____________________'),
 ('Publication evidence','Publisher: ____________________  Publication time: ____________________\nCurrent edition confirmed: ____  Public URL: ____________________\nFirst/middle/last chapters, table, figure and source download checked: ____'),
 ('App and offline evidence','Device / OS / app build: ____________________\nOnline discovery and intended edition: ____  Download completed: ____\nOffline chapters, tables and figures: ____  Reconnected: ____\nTester and time: ____________________'),
 ('Handover','Open defects and owner: ____________________\nNext review date: ____________________  Escalation contact: ____________________\nNotification campaign, if any: ____________________')])
textpage('Sources, scope and maintenance',[
 ('Existing SOPs were available','This guide expands repository runbooks: guideline-authoring-and-publication-workflow.md; guideline-editorial-review-workspace.md; guideline-editor-permissions.md; guideline-warning-resolution.md; guideline-validation-troubleshooting.md; content-hub-and-document-publishing-workflow.md. All are under docs/.'),
 ('Implemented controls','Capture labels were checked in the actual running dashboard, plus dashboard/components/guidelines/ and dashboard/app/(dashboard)/guidelines/. Review policy is implemented in backend/internal/models/guideline_block_review_policy.go.'),
 ('Image provenance','Native screenshots were captured from the real dashboard and public reader on 25 October 2026. Screen plates are unaltered captures apart from cropping and scaling; no dashboard controls were recreated or generated. Android plates are existing files in user_app/fastlane/metadata/android/en-US/images/phoneScreenshots/.'),
 ('Known UI caveats captured during authoring','The review tab strip could be overlapped by the sticky header; keyboard navigation still opened the tabs. Legacy comparison table counts disagreed with the actual structured table/report; reconcile against rendered output and source. An advisory table warning can remain visible after the table is individually reviewed.'),
 ('Maintenance and ownership','SOP owner: ____________________  Governance approver: ____________________\nApproval date: ____________________  Next review: ____________________\nReplace affected screen plates after workflow, policy, validator or reader changes. Record real web/app/offline acceptance evidence for each publication.')])
C.save();r=PdfReader(str(OUT));text='\n'.join(p.extract_text() or '' for p in r.pages)
assert len(r.pages)==PN
for term in ['Accept regenerated projection','Completeness report','Confirm approval','offline','Publish','Withdraw','Source organization']:assert term in text,term
(WORK/'text-v2.txt').write_text(text);(WORK/'layout-v2.json').write_text(json.dumps(layout,indent=2));(WORK/'screenshot-manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'output':str(OUT),'pages':PN,'screen_plates':len(manifest),'bytes':OUT.stat().st_size,'minimum_bottom':min(p['bottom'] for p in layout)},indent=2))
