package services

import (
	"encoding/csv"
	"strings"
	"testing"
	"time"

	"mediguide/internal/models"

	"github.com/google/uuid"
)

func TestGuidelineCompletenessReportIsReadOnlyAndExplainsCoverage(t *testing.T) {
	db := guidelineReviewTestDB(t)
	service := GuidelineService{DB: db}
	document := models.GuidelineDocument{Title: "Diabetes guideline"}
	if err := db.Create(&document).Error; err != nil {
		t.Fatal(err)
	}
	current := models.GuidelineVersion{DocumentID: document.ID, Version: "2026.09.01", Status: "published"}
	if err := db.Create(&current).Error; err != nil {
		t.Fatal(err)
	}
	document.CurrentVersionID = &current.ID
	if err := db.Model(&document).Update("current_version_id", current.ID).Error; err != nil {
		t.Fatal(err)
	}
	oldSection := models.GuidelineSection{VersionID: current.ID, Title: "Old chapter", Slug: "old", Level: 2}
	if err := db.Create(&oldSection).Error; err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 3; i++ {
		block := models.GuidelineContentBlock{VersionID: current.ID, SectionID: &oldSection.ID, Type: models.GuidelineBlockParagraph, ReviewStatus: models.GuidelineBlockReviewed, ContentJSON: []byte(`{"type":"paragraph","text":"reviewed"}`)}
		if err := db.Create(&block).Error; err != nil {
			t.Fatal(err)
		}
	}

	revisionID, jobID := uuid.New(), uuid.New()
	candidate := models.GuidelineVersion{DocumentID: document.ID, Version: "2026.10.01", Status: "review_required", CurrentMarkdownRevisionID: &revisionID, StructuredMarkdownRevisionID: &revisionID}
	if err := db.Create(&candidate).Error; err != nil {
		t.Fatal(err)
	}
	root := models.GuidelineSection{VersionID: candidate.ID, Title: "Diabetes guideline", Slug: "title", Level: 1}
	if err := db.Create(&root).Error; err != nil {
		t.Fatal(err)
	}
	reviewedLeaf := models.GuidelineSection{VersionID: candidate.ID, ParentID: &root.ID, Title: "Diagnosis", Slug: "diagnosis", Level: 2, SortOrder: 1}
	emptyLeaf := models.GuidelineSection{VersionID: candidate.ID, ParentID: &root.ID, Title: "Treatment", Slug: "treatment", Level: 2, SortOrder: 2}
	if err := db.Create(&reviewedLeaf).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&emptyLeaf).Error; err != nil {
		t.Fatal(err)
	}
	paragraph := models.GuidelineContentBlock{VersionID: candidate.ID, SectionID: &reviewedLeaf.ID, Type: models.GuidelineBlockParagraph, ReviewStatus: models.GuidelineBlockReviewed, ContentJSON: []byte(`{"type":"paragraph","text":"reviewed"}`)}
	table := models.GuidelineContentBlock{VersionID: candidate.ID, SectionID: &reviewedLeaf.ID, Type: models.GuidelineBlockTable, ReviewStatus: models.GuidelineBlockDraft, ContentJSON: []byte(`{"type":"table","columns":[],"rows":[]}`)}
	rejected := models.GuidelineContentBlock{VersionID: candidate.ID, SectionID: &emptyLeaf.ID, Type: models.GuidelineBlockReference, ReviewStatus: models.GuidelineBlockRejected, ContentJSON: []byte(`{"type":"reference","citation":"old"}`)}
	if err := db.Create(&paragraph).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&table).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&rejected).Error; err != nil {
		t.Fatal(err)
	}
	chunk := models.GuidelineChunk{DocumentID: document.ID, VersionID: candidate.ID, SectionID: &reviewedLeaf.ID, BlockID: &paragraph.ID, Content: "reviewed", ReviewStatus: "approved"}
	if err := db.Create(&chunk).Error; err != nil {
		t.Fatal(err)
	}
	filename := "source.pdf"
	asset := models.GuidelineAsset{VersionID: candidate.ID, Type: models.GuidelineAssetOriginalPDF, MIMEType: "application/pdf", StorageKey: "source.pdf", Checksum: "sum", SizeBytes: 1, OriginalFilename: &filename, ReviewStatus: models.GuidelineBlockReviewed}
	if err := db.Create(&asset).Error; err != nil {
		t.Fatal(err)
	}
	job := models.IngestionJob{Base: models.Base{ID: jobID}, VersionID: candidate.ID, JobType: "markdown_ingestion", Status: "completed", ProgressStage: "review_required", ProgressPercent: 100}
	if err := db.Create(&job).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&models.GuidelineMarkdownRevision{Base: models.Base{ID: revisionID}, DocumentID: document.ID, VersionID: candidate.ID, RevisionNumber: 1, StorageKey: "source.md", Checksum: "sum", SourceType: "duplicate", IsCurrent: true, RegenerationJobID: &jobID}).Error; err != nil {
		t.Fatal(err)
	}
	reviewedAt := time.Now().UTC()
	actor := uuid.New()
	if err := db.Create(&models.GuidelineRegenerationReview{VersionID: candidate.ID, RevisionID: revisionID, JobID: jobID, Status: "accepted", ReviewedBy: &actor, ReviewedAt: &reviewedAt}).Error; err != nil {
		t.Fatal(err)
	}

	report, err := service.GuidelineCompletenessReport(candidate.ID)
	if err != nil {
		t.Fatal(err)
	}
	if !report.ReadOnly || report.TotalBlocks != 3 || report.ActiveBlocks != 2 || report.ReviewedBlocks != 1 || report.ReviewedPercentage != 50 {
		t.Fatalf("unexpected coverage: %#v", report)
	}
	if report.Sections.TotalSections != 3 || report.Sections.ReviewedSections != 1 || report.Sections.LeafSections != 2 || report.Sections.EmptyLeafSections != 1 {
		t.Fatalf("unexpected section summary: %#v", report.Sections)
	}
	if len(report.EmptyLeafSections) != 1 || report.EmptyLeafSections[0].Title != "Treatment" {
		t.Fatalf("unexpected empty leaves: %#v", report.EmptyLeafSections)
	}
	if !report.Sources.OriginalPDFAvailable || !report.Sources.OriginalPDFReviewed || !report.Sources.ReviewedFallbackAvailable {
		t.Fatalf("source availability missing: %#v", report.Sources)
	}
	if !report.Regeneration.IdentitiesMatch || report.Regeneration.AcceptedBy == nil || *report.Regeneration.AcceptedBy != actor {
		t.Fatalf("regeneration identity missing: %#v", report.Regeneration)
	}
	if report.RAG.ApprovedChunks != 1 || report.RAG.ReviewedBlocksWithoutChunks != 0 || report.RAG.EmbeddingColumnAvailable || report.RAG.Ready {
		t.Fatalf("unexpected RAG readiness: %#v", report.RAG)
	}
	if report.CurrentComparison == nil || report.CurrentComparison.SameVersion || metricDelta(report.CurrentComparison.Metrics, "reviewed_blocks") != -2 {
		t.Fatalf("unexpected comparison: %#v", report.CurrentComparison)
	}

	var stored models.GuidelineVersion
	if err := db.First(&stored, "id = ?", candidate.ID).Error; err != nil {
		t.Fatal(err)
	}
	if stored.Status != "review_required" || stored.ApprovedBy != nil {
		t.Fatalf("report mutated candidate: %#v", stored)
	}

	data, err := GuidelineCompletenessReportCSV(report)
	if err != nil {
		t.Fatal(err)
	}
	records, err := csv.NewReader(strings.NewReader(string(data))).ReadAll()
	if err != nil {
		t.Fatal(err)
	}
	if len(records) < 10 || strings.Join(records[0], ",") != "scope,metric,candidate_value,current_value,delta" {
		t.Fatalf("unexpected CSV export: %s", data)
	}
}

func TestGuidelineCompletenessReportUsesCandidateEmbeddingsForReadiness(t *testing.T) {
	db := guidelineReviewTestDB(t)
	if err := db.Exec("ALTER TABLE guideline_chunks ADD COLUMN embedding BLOB").Error; err != nil {
		t.Fatal(err)
	}
	service := GuidelineService{DB: db}
	document := models.GuidelineDocument{Title: "Candidate"}
	if err := db.Create(&document).Error; err != nil {
		t.Fatal(err)
	}
	version := models.GuidelineVersion{DocumentID: document.ID, Version: "draft", Status: "review_required"}
	if err := db.Create(&version).Error; err != nil {
		t.Fatal(err)
	}
	section := models.GuidelineSection{VersionID: version.ID, Title: "Treatment", Slug: "treatment", Level: 2}
	if err := db.Create(&section).Error; err != nil {
		t.Fatal(err)
	}
	block := models.GuidelineContentBlock{VersionID: version.ID, SectionID: &section.ID, Type: models.GuidelineBlockParagraph, ReviewStatus: models.GuidelineBlockReviewed, ContentJSON: []byte(`{"type":"paragraph","text":"reviewed"}`)}
	if err := db.Create(&block).Error; err != nil {
		t.Fatal(err)
	}
	chunk := models.GuidelineChunk{DocumentID: document.ID, VersionID: version.ID, SectionID: &section.ID, BlockID: &block.ID, Content: "reviewed", ReviewStatus: "reviewed"}
	if err := db.Create(&chunk).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Exec("UPDATE guideline_chunks SET embedding = ? WHERE id = ?", []byte{1, 2, 3}, chunk.ID).Error; err != nil {
		t.Fatal(err)
	}

	report, err := service.GuidelineCompletenessReport(version.ID)
	if err != nil {
		t.Fatal(err)
	}
	if report.RAG.TotalChunks != 1 || report.RAG.ApprovedChunks != 0 || report.RAG.ReviewedBlockChunks != 1 || report.RAG.EmbeddedReviewedBlockChunks != 1 || report.RAG.MissingReviewedEmbeddings != 0 || !report.RAG.Ready {
		t.Fatalf("candidate embeddings should be ready before publication: %#v", report.RAG)
	}
}

func metricDelta(metrics []GuidelineCompletenessMetric, name string) int64 {
	for _, metric := range metrics {
		if metric.Name == name {
			return metric.Delta
		}
	}
	return 0
}
