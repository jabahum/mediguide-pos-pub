package services

import (
	"errors"
	"testing"
	"time"

	"mediguide/internal/models"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

func TestCalculatorUsageSummary(t *testing.T) {
	s := testCalculatorService(t)
	tool := models.Calculator{Name: "Assessment", Type: "calculator", Version: "1", AppFileJSON: datatypes.JSON(`{}`)}
	other := models.Calculator{Name: "Other", Type: "checklist", Version: "1", AppFileJSON: datatypes.JSON(`{}`)}
	for _, item := range []*models.Calculator{&tool, &other} {
		if err := s.DB.Create(item).Error; err != nil {
			t.Fatal(err)
		}
	}
	now := time.Date(2026, 10, 25, 20, 0, 0, 0, time.UTC)
	empty, err := s.usageSummaryAt(tool.ID, now)
	if err != nil || empty.TotalSessions != 0 || len(empty.Daily) != 30 {
		t.Fatalf("empty: %+v, %v", empty, err)
	}
	owner, second := uuid.New(), uuid.New()
	end := "2026-10-25T12:01:00Z"
	logs := []models.CalculatorUsageLog{
		{CalculatorID: tool.ID, UserID: owner, SessionStart: "2026-09-25T23:59:59Z"},
		{CalculatorID: tool.ID, UserID: owner, SessionStart: "2026-09-26T00:00:00Z", SessionEnd: &end},
		{CalculatorID: tool.ID, UserID: second, SessionStart: "2026-10-25T12:00:00.123Z", SessionEnd: &end},
		{CalculatorID: other.ID, UserID: uuid.New(), SessionStart: "2026-10-25T12:00:00Z"},
		{CalculatorID: tool.ID, UserID: uuid.New(), SessionStart: "2026-10-25T13:00:00Z"},
	}
	for i := range logs {
		if err := s.DB.Create(&logs[i]).Error; err != nil {
			t.Fatal(err)
		}
	}
	if err := s.DB.Delete(&logs[4]).Error; err != nil {
		t.Fatal(err)
	}
	got, err := s.usageSummaryAt(tool.ID, now)
	if err != nil {
		t.Fatal(err)
	}
	if got.TotalSessions != 3 || got.UniqueUsers != 2 || got.EndedSessions != 2 || got.RecentSessions != 2 {
		t.Fatalf("wrong totals: %+v", got)
	}
	if got.Since != "2026-09-26" || got.Until != "2026-10-25" || got.Daily[0].Sessions != 1 || got.Daily[29].Sessions != 1 || got.Daily[1].Sessions != 0 {
		t.Fatalf("wrong daily series: %+v", got)
	}
	if _, err := s.usageSummaryAt(uuid.New(), now); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("missing tool: %v", err)
	}
}
