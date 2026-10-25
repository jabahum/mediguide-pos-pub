package services

import (
	"time"

	"mediguide/internal/models"

	"github.com/google/uuid"
)

type CalculatorUsageDay struct {
	Date     string `json:"date"`
	Sessions int64  `json:"sessions"`
}

// CalculatorUsageSummary counts synced tool opens, not completed assessments.
type CalculatorUsageSummary struct {
	TotalSessions  int64                `json:"total_sessions"`
	UniqueUsers    int64                `json:"unique_users"`
	EndedSessions  int64                `json:"ended_sessions"`
	RecentSessions int64                `json:"recent_sessions"`
	Since          string               `json:"since"`
	Until          string               `json:"until"`
	Daily          []CalculatorUsageDay `json:"daily" gorm:"-"`
}

func (s CalculatorService) UsageSummary(id uuid.UUID) (*CalculatorUsageSummary, error) {
	return s.usageSummaryAt(id, time.Now())
}

func (s CalculatorService) usageSummaryAt(id uuid.UUID, now time.Time) (*CalculatorUsageSummary, error) {
	if _, err := s.Get(id); err != nil {
		return nil, err
	}
	today := now.UTC().Truncate(24 * time.Hour)
	since := today.AddDate(0, 0, -29).Format(time.DateOnly)
	until := today.AddDate(0, 0, 1).Format(time.DateOnly)
	result := &CalculatorUsageSummary{}
	// session_start is normalized to UTC RFC3339 on ingestion. Date prefixes
	// preserve chronological ordering across the variable fractional precision.
	if err := s.DB.Model(&models.CalculatorUsageLog{}).Where("calculator_id = ?", id).
		Select(`COUNT(*) AS total_sessions, COUNT(DISTINCT user_id) AS unique_users,
		COUNT(CASE WHEN session_end IS NOT NULL THEN 1 END) AS ended_sessions,
		COUNT(CASE WHEN session_start >= ? AND session_start < ? THEN 1 END) AS recent_sessions`, since, until).
		Scan(result).Error; err != nil {
		return nil, err
	}
	result.Since = since
	result.Until = today.Format(time.DateOnly)
	result.Daily = make([]CalculatorUsageDay, 0, 30)
	var days []CalculatorUsageDay
	if err := s.DB.Model(&models.CalculatorUsageLog{}).
		Where("calculator_id = ? AND session_start >= ? AND session_start < ?", id, since, until).
		Select("SUBSTR(session_start, 1, 10) AS date, COUNT(*) AS sessions").
		Group("SUBSTR(session_start, 1, 10)").Scan(&days).Error; err != nil {
		return nil, err
	}
	counts := make(map[string]int64, len(days))
	for _, day := range days {
		counts[day.Date] = day.Sessions
	}
	for i := -29; i <= 0; i++ {
		date := today.AddDate(0, 0, i).Format(time.DateOnly)
		result.Daily = append(result.Daily, CalculatorUsageDay{Date: date, Sessions: counts[date]})
	}
	return result, nil
}
