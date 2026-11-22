package service

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// WeeklyReportNoteKey is the system config whose value is added to every
// weekly email ("informasi terbaru").
const WeeklyReportNoteKey = "weekly_report_note"

type WeeklyReportResult struct {
	WeekStart  string   `json:"week_start"`
	Recipients int      `json:"recipients"`
	Sent       int      `json:"sent"`
	Skipped    int      `json:"skipped"`
	Failed     int      `json:"failed"`
	DryRun     bool     `json:"dry_run"`
	Errors     []string `json:"errors,omitempty"`
}

type WeeklyReportService struct {
	DB                           *gorm.DB
	ProgramRepository            *repository.ProgramRepository
	TransactionProgramRepository *repository.TransactionProgramRepository
	PackageRepository            *repository.PackageRepository
	LiveClassRepository          *repository.LiveClassRepository
	MentoringRepository          *repository.MentoringRepository
	SystemConfigRepository       *repository.SystemConfigRepository
	SKDResultService             *SKDResultService
	SendMail                     func(to string, subject string, html string) error
	WebURL                       string
	Now                          func() time.Time
}

// weekStart is the Monday (WIB) of the week that contains t.
func weekStart(t time.Time) time.Time {
	local := t.In(wib)
	offset := (int(local.Weekday()) + 6) % 7
	day := local.AddDate(0, 0, -offset)
	return time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, time.UTC)
}

func programIsRunning(program entity.Program, now time.Time) bool {
	if !program.StartTime.IsZero() && now.Before(program.StartTime.AddDate(0, 0, -7)) {
		return false
	}
	if !program.EndTime.IsZero() && now.After(program.EndTime.AddDate(0, 0, 7)) {
		return false
	}
	return true
}

func subtestLabel(code string) string {
	for _, subtest := range SKDSubtests {
		if subtest.Code == code {
			return strings.ToUpper(code) + " (" + subtest.Name + ")"
		}
	}
	return strings.ToUpper(code)
}

// buildReport prepares the email of one participant.
func (service *WeeklyReportService) buildReport(ctx context.Context, user entity.User, program entity.Program, pkg entity.Package, classes []entity.LiveClass, note string, now time.Time) (helper.WeeklyReportData, error) {
	progress, err := service.SKDResultService.ProgramProgress(ctx, program.ProgramID, user.UserID, pkg.TryoutCount)
	if err != nil {
		return helper.WeeklyReportData{}, err
	}

	data := helper.WeeklyReportData{
		Name:        user.Name,
		ProgramName: program.Name,
		PackageName: pkg.Name,
		Note:        note,
		NothingYet:  true,
	}
	if service.WebURL != "" {
		data.DashboardURL = strings.TrimRight(service.WebURL, "/") + "/tryout"
	}

	previous := -1
	for _, item := range progress {
		row := helper.WeeklyReportTryout{Title: item.Title, Completed: item.Completed}
		if item.Completed {
			data.NothingYet = false
			row.Total = item.TotalScore
			row.Rank = item.Rank
			row.Participants = item.Participants
			row.TWK = item.Scores["twk"]
			row.TIU = item.Scores["tiu"]
			row.TKP = item.Scores["tkp"]
			row.PassedAll = item.PassedAll
			switch {
			case previous < 0:
			case item.TotalScore > previous:
				row.Trend = fmt.Sprintf("naik %d", item.TotalScore-previous)
			case item.TotalScore < previous:
				row.Trend = fmt.Sprintf("turun %d", previous-item.TotalScore)
			default:
				row.Trend = "sama"
			}
			previous = item.TotalScore
			data.Weakest = subtestLabel(item.Weakest)
		}
		// Only list TOs that have opened.
		if item.Completed || !now.Before(item.StartTime) {
			data.Tryouts = append(data.Tryouts, row)
		}
	}

	until := now.AddDate(0, 0, 7)
	for _, class := range classes {
		if class.Sequence <= pkg.ClassCount && class.StartsAt.After(now) && class.StartsAt.Before(until) {
			data.Upcoming = append(data.Upcoming, helper.WeeklyReportItem{When: formatWIB(class.StartsAt), Title: class.Title})
		}
	}
	var slots []entity.MentoringSlot
	if err := service.DB.WithContext(ctx).
		Where("booked_by = ? AND program_id = ? AND status = ? AND starts_at BETWEEN ? AND ?", user.UserID, program.ProgramID, entity.SlotBooked, now, until).
		Find(&slots).Error; err != nil {
		return helper.WeeklyReportData{}, err
	}
	for _, slot := range slots {
		data.Upcoming = append(data.Upcoming, helper.WeeklyReportItem{When: formatWIB(slot.StartsAt), Title: "Mentoring 1:1 bersama " + slot.TutorName})
	}
	return data, nil
}

// Run sends this week's report to every participant whose package includes
// it. programID limits it to one program; dryRun only counts recipients.
// Each participant gets at most one email per program per week.
func (service *WeeklyReportService) Run(ctx context.Context, programID string, dryRun bool) (WeeklyReportResult, error) {
	now := service.Now()
	week := weekStart(now)
	result := WeeklyReportResult{WeekStart: week.Format("2006-01-02"), DryRun: dryRun}

	programs := service.ProgramRepository.FindAll(ctx, model.FindAllProgramsRequest{})
	note := ""
	if service.SystemConfigRepository != nil {
		if config, err := service.SystemConfigRepository.FindByKey(ctx, WeeklyReportNoteKey); err == nil {
			note = strings.TrimSpace(config.Value)
		}
	}

	for _, program := range programs {
		if programID != "" && program.ProgramID.String() != programID {
			continue
		}
		if programID == "" && !programIsRunning(program, now) {
			continue
		}
		packages, err := service.PackageRepository.FindByProgram(ctx, program.ProgramID, false)
		if err != nil {
			return result, err
		}
		packageByID := map[uuid.UUID]entity.Package{}
		for _, pkg := range packages {
			packageByID[pkg.PackageID] = pkg
		}
		members, err := service.TransactionProgramRepository.FindProgramMembers(ctx, program.ProgramID)
		if err != nil {
			return result, err
		}
		classes, err := service.LiveClassRepository.FindByPrograms(ctx, []uuid.UUID{program.ProgramID})
		if err != nil {
			return result, err
		}

		for _, member := range members {
			if member.PackageID == nil {
				continue
			}
			pkg, ok := packageByID[*member.PackageID]
			if !ok || !pkg.HasWeeklyReport || member.User.Email == "" {
				continue
			}
			result.Recipients++

			var existing entity.WeeklyReportLog
			found := service.DB.WithContext(ctx).
				Where("user_id = ? AND program_id = ? AND week_start = ?", member.UserID, program.ProgramID, week).
				Limit(1).Find(&existing).RowsAffected > 0
			if found && existing.Status == "SENT" {
				result.Skipped++
				continue
			}
			if dryRun {
				continue
			}

			data, err := service.buildReport(ctx, member.User, program, pkg, classes, note, now)
			if err == nil {
				var html string
				html, err = helper.TemplateWeeklyReport(data)
				if err == nil {
					err = service.SendMail(member.User.Email, "Progres mingguan "+program.Name, html)
				}
			}

			entry := entity.WeeklyReportLog{UserID: member.UserID, ProgramID: program.ProgramID, WeekStart: week, Status: "SENT", SentAt: now}
			if err != nil {
				entry.Status = "FAILED"
				entry.Error = err.Error()
				result.Failed++
				result.Errors = append(result.Errors, member.User.Email+": "+err.Error())
				log.Printf("weekly report for %s failed: %v", member.UserID, err)
			} else {
				result.Sent++
			}
			if logErr := service.DB.WithContext(ctx).Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "user_id"}, {Name: "program_id"}, {Name: "week_start"}},
				DoUpdates: clause.AssignmentColumns([]string{"status", "error", "sent_at"}),
			}).Create(&entry).Error; logErr != nil {
				log.Printf("weekly report log failed: %v", logErr)
			}
		}
	}
	return result, nil
}
