package services

import (
	"fmt"
	"strings"
	"testing"

	"mediguide/internal/models"

	"github.com/google/uuid"
)

func TestGuidelineChapterCoverageSurvivesHierarchyRepair(t *testing.T) {
	for _, scenario := range []string{"hierarchy repair", "unreviewed chapters", "rejected chapters", "removed chapters"} {
		t.Run(scenario, func(t *testing.T) {
			db := guidelineReviewTestDB(t)
			document := models.GuidelineDocument{Title: "Mortality Surveillance"}
			if err := db.Create(&document).Error; err != nil {
				t.Fatal(err)
			}
			current := models.GuidelineVersion{DocumentID: document.ID, Version: "1", Status: "published"}
			candidate := models.GuidelineVersion{DocumentID: document.ID, Version: "2", Status: "review_required", OriginalFileKey: "source.pdf"}
			for _, version := range []*models.GuidelineVersion{&current, &candidate} {
				if err := db.Create(version).Error; err != nil {
					t.Fatal(err)
				}
			}
			if err := db.Model(&document).Update("current_version_id", current.ID).Error; err != nil {
				t.Fatal(err)
			}

			root := models.GuidelineSection{Base: models.Base{ID: uuid.New()}, VersionID: candidate.ID, Title: document.Title, Level: 1}
			sections := []models.GuidelineSection{root}
			blocks := []models.GuidelineContentBlock{}
			chapterNames := []string{"One", "Two", "Three", "Four", "Five", "Six"}
			var firstChapter uuid.UUID
			// The legacy PDF has 18 flat roots. The corrected Markdown has ten
			// H2s (six chapters and four ancillary sections) and eight H3s.
			for index := 0; index < 18; index++ {
				title := fmt.Sprintf("Supporting section %d", index)
				if index < 6 {
					title = "Chapter " + chapterNames[index] + ": Mortality surveillance"
				}
				previous := models.GuidelineSection{VersionID: current.ID, Title: title, Slug: fmt.Sprintf("section-%d", index), Level: 1}
				if err := db.Create(&previous).Error; err != nil {
					t.Fatal(err)
				}
				section := models.GuidelineSection{Base: models.Base{ID: uuid.New()}, VersionID: candidate.ID, Title: title, Slug: previous.Slug, Level: 2, ParentID: &root.ID}
				if index == 0 {
					firstChapter = section.ID
				}
				if index >= 10 {
					section.Level, section.ParentID = 3, &firstChapter
				}
				removed := scenario == "removed chapters" && index >= 2 && index < 6
				if !removed {
					sections = append(sections, section)
				}
				for blockIndex := 0; blockIndex < 2; blockIndex++ {
					block := models.GuidelineContentBlock{VersionID: current.ID, SectionID: &previous.ID, Type: models.GuidelineBlockParagraph, ReviewStatus: models.GuidelineBlockReviewed, ContentJSON: []byte(`{"type":"paragraph","text":"Source-verified prose."}`)}
					if err := db.Create(&block).Error; err != nil {
						t.Fatal(err)
					}
					block.ID, block.VersionID, block.SectionID = uuid.New(), candidate.ID, &section.ID
					if scenario == "unreviewed chapters" && index >= 2 && index < 6 {
						block.ReviewStatus = models.GuidelineBlockDraft
					}
					if scenario == "rejected chapters" && index >= 2 && index < 6 {
						block.ReviewStatus = models.GuidelineBlockRejected
					}
					if !removed {
						blocks = append(blocks, block)
					}
				}
			}
			issues, err := guidelinePublicationCompletenessIssues(db, &candidate, sections, blocks, nil)
			if err != nil {
				t.Fatal(err)
			}
			regression := hasGuidelineReviewIssue(issues, "reviewed_content_regression")
			if scenario == "hierarchy repair" {
				if len(issues) != 0 {
					t.Fatalf("hierarchy repair rejected without content loss: %#v", issues)
				}
				if got := guidelineStructureCounts(sections, blocks).chapters; got != 6 {
					t.Fatalf("got %d chapters, want 6", got)
				}
			} else if !regression {
				t.Fatalf("lost reviewed chapter coverage was accepted: %#v", issues)
			} else {
				for _, issue := range issues {
					if issue.Code == "reviewed_content_regression" && !strings.Contains(issue.Message, "chapters with reviewed content 6→2") {
						t.Fatalf("unexpected coverage comparison: %s", issue.Message)
					}
				}
			}
		})
	}
}

func TestGuidelineChapterSections(t *testing.T) {
	for _, title := range []string{"Chapter One: Introduction", "CHAPTER SIX: Monitoring", "Chapter 12: Guidance", "Chapter IV: Guidance"} {
		sections := []models.GuidelineSection{
			{Base: models.Base{ID: uuid.New()}, Title: "Glossary", Level: 1},
			{Base: models.Base{ID: uuid.New()}, Title: title, Level: 1},
		}
		if got := guidelineChapterSections(sections); len(got) != 1 || got[0].Title != title {
			t.Errorf("named chapter %q not distinguished from front matter: %#v", title, got)
		}
	}
	root := models.GuidelineSection{Base: models.Base{ID: uuid.New()}, Title: "Guideline", Level: 1}
	first := models.GuidelineSection{Base: models.Base{ID: uuid.New()}, Title: "Diagnosis", Level: 2, ParentID: &root.ID}
	second := models.GuidelineSection{Base: models.Base{ID: uuid.New()}, Title: "Treatment", Level: 2, ParentID: &root.ID}
	if got := guidelineChapterSections([]models.GuidelineSection{root, first, second}); len(got) != 2 {
		t.Fatalf("unnamed document-root chapters changed: %#v", got)
	}
	first.ParentID, second.ParentID = nil, nil
	if got := guidelineChapterSections([]models.GuidelineSection{first, second}); len(got) != 2 {
		t.Fatalf("unnamed flat chapters changed: %#v", got)
	}
}
