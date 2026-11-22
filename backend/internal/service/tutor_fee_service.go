package service

import (
	"context"
	"math"
	"sort"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
)

// Tutor fee rules from the business plan ("Fee tutor dan pembagian hasil").
const (
	TutorClassMinimumFee  = 200000
	TutorBonusRatingFloor = 4.7
	TutorBonusPercent     = 10
)

type TutorFeeClass struct {
	ClassID        uuid.UUID `json:"class_id"`
	Sequence       int       `json:"sequence"`
	Title          string    `json:"title"`
	TutorName      string    `json:"tutor_name"`
	StartsAt       time.Time `json:"starts_at"`
	Finished       bool      `json:"finished"`
	Participants   int       `json:"participants"`
	Attendees      int       `json:"attendees"`
	RatingAvg      float64   `json:"rating_avg"`
	RatingCount    int       `json:"rating_count"`
	GrossFee       int       `json:"gross_fee"`
	MinimumApplied bool      `json:"minimum_applied"`
	Fee            int       `json:"fee"`
}

type TutorFeeSummary struct {
	TutorName         string  `json:"tutor_name"`
	Classes           int     `json:"classes"`
	ClassFee          int     `json:"class_fee"`
	RatingAvg         float64 `json:"rating_avg"`
	RatingCount       int     `json:"rating_count"`
	Bonus             int     `json:"bonus"`
	MentoringSessions int     `json:"mentoring_sessions"`
	MentoringFee      int     `json:"mentoring_fee"`
	Total             int     `json:"total"`
}

type TutorFeeReport struct {
	ProgramID       uuid.UUID         `json:"program_id"`
	ProgramName     string            `json:"program_name"`
	GeneratedAt     time.Time         `json:"generated_at"`
	Revenue         int               `json:"revenue"`
	Classes         []TutorFeeClass   `json:"classes"`
	Tutors          []TutorFeeSummary `json:"tutors"`
	QuestionPoolFee int               `json:"question_pool_fee"`
	TotalTutorFee   int               `json:"total_tutor_fee"`
	Notes           []string          `json:"notes"`
}

type TutorFeeService struct {
	ProgramRepository            *repository.ProgramRepository
	OrderRepository              *repository.OrderRepository
	TransactionProgramRepository *repository.TransactionProgramRepository
	PackageRepository            *repository.PackageRepository
	LiveClassRepository          *repository.LiveClassRepository
	MentoringRepository          *repository.MentoringRepository
	Now                          func() time.Time
}

// paidMember is what one participant paid and holds in the program.
type paidMember struct {
	Paid    int
	Package entity.Package
}

// ComputeClassFee is the gross fee of one class: for each participant whose
// package covers the class, paid x tutor% / classes in the package.
func ComputeClassFee(sequence int, members []paidMember) (gross float64, participants int) {
	for _, member := range members {
		if member.Package.ClassCount < sequence || member.Package.ClassCount == 0 {
			continue
		}
		participants++
		gross += float64(member.Paid) * member.Package.TutorFeePercent / 100 / float64(member.Package.ClassCount)
	}
	return gross, participants
}

func (service *TutorFeeService) Report(ctx context.Context, programID string) (TutorFeeReport, error) {
	id, err := parseID(programID, "program_id")
	if err != nil {
		return TutorFeeReport{}, err
	}
	program, err := service.ProgramRepository.FindByID(ctx, id)
	if err != nil {
		return TutorFeeReport{}, exception.NotFoundError{Message: "program Not Found"}
	}
	now := service.Now()

	packages, err := service.PackageRepository.FindByProgram(ctx, id, false)
	if err != nil {
		return TutorFeeReport{}, err
	}
	packageByID := map[uuid.UUID]entity.Package{}
	for _, pkg := range packages {
		packageByID[pkg.PackageID] = pkg
	}

	orders, err := service.OrderRepository.FindPaidByProgram(ctx, id)
	if err != nil {
		return TutorFeeReport{}, err
	}
	paidByUser := map[uuid.UUID]int{}
	revenue := 0
	for _, order := range orders {
		paidByUser[order.UserID] += order.Amount
		revenue += order.Amount
	}

	// The package a participant holds now decides which classes they cover.
	membersRows, err := service.TransactionProgramRepository.FindProgramMembers(ctx, id)
	if err != nil {
		return TutorFeeReport{}, err
	}
	members := []paidMember{}
	packageOfUser := map[uuid.UUID]entity.Package{}
	questionPool := 0.0
	for _, row := range membersRows {
		if row.PackageID == nil {
			continue
		}
		pkg, ok := packageByID[*row.PackageID]
		if !ok {
			continue
		}
		packageOfUser[row.UserID] = pkg
		paid := paidByUser[row.UserID]
		if paid == 0 {
			continue
		}
		if pkg.ClassCount == 0 {
			// Packages without classes pay a royalty into the question pool.
			questionPool += float64(paid) * pkg.TutorFeePercent / 100
			continue
		}
		members = append(members, paidMember{Paid: paid, Package: pkg})
	}

	classes, err := service.LiveClassRepository.FindByPrograms(ctx, []uuid.UUID{id})
	if err != nil {
		return TutorFeeReport{}, err
	}
	classIDs := make([]uuid.UUID, 0, len(classes))
	for _, class := range classes {
		classIDs = append(classIDs, class.ClassID)
	}
	stats, err := service.LiveClassRepository.Stats(ctx, classIDs)
	if err != nil {
		return TutorFeeReport{}, err
	}

	report := TutorFeeReport{
		ProgramID:   id,
		ProgramName: program.Name,
		GeneratedAt: now,
		Revenue:     revenue,
		Classes:     []TutorFeeClass{},
		Tutors:      []TutorFeeSummary{},
	}
	tutors := map[string]*TutorFeeSummary{}
	ratingSum := map[string]float64{}
	tutor := func(name string) *TutorFeeSummary {
		if name == "" {
			name = "(tanpa nama)"
		}
		if tutors[name] == nil {
			tutors[name] = &TutorFeeSummary{TutorName: name}
		}
		return tutors[name]
	}

	for _, class := range classes {
		gross, participants := ComputeClassFee(class.Sequence, members)
		stat := stats[class.ClassID]
		line := TutorFeeClass{
			ClassID:      class.ClassID,
			Sequence:     class.Sequence,
			Title:        class.Title,
			TutorName:    class.TutorName,
			StartsAt:     class.StartsAt,
			Finished:     now.After(class.EndsAt),
			Participants: participants,
			Attendees:    stat.Attendees,
			RatingAvg:    math.Round(stat.RatingAvg*100) / 100,
			RatingCount:  stat.RatingCount,
			GrossFee:     int(math.Round(gross)),
		}
		// Fees are only owed for classes that took place.
		if line.Finished {
			line.Fee = line.GrossFee
			if line.Fee < TutorClassMinimumFee {
				line.Fee = TutorClassMinimumFee
				line.MinimumApplied = true
			}
			summary := tutor(class.TutorName)
			summary.Classes++
			summary.ClassFee += line.Fee
			summary.RatingCount += stat.RatingCount
			ratingSum[summary.TutorName] += stat.RatingAvg * float64(stat.RatingCount)
		}
		report.Classes = append(report.Classes, line)
	}

	slots, err := service.MentoringRepository.FindByProgram(ctx, id)
	if err != nil {
		return TutorFeeReport{}, err
	}
	for _, slot := range slots {
		if slot.Status != entity.SlotDone || slot.BookedBy == nil {
			continue
		}
		summary := tutor(slot.TutorName)
		summary.MentoringSessions++
		summary.MentoringFee += packageOfUser[*slot.BookedBy].MentoringFee
	}

	for name, summary := range tutors {
		if summary.RatingCount > 0 {
			summary.RatingAvg = math.Round(ratingSum[name]/float64(summary.RatingCount)*100) / 100
		}
		if summary.RatingCount > 0 && summary.RatingAvg >= TutorBonusRatingFloor {
			summary.Bonus = int(math.Round(float64(summary.ClassFee) * TutorBonusPercent / 100))
		}
		summary.Total = summary.ClassFee + summary.Bonus + summary.MentoringFee
		report.Tutors = append(report.Tutors, *summary)
		report.TotalTutorFee += summary.Total
	}
	sort.Slice(report.Tutors, func(i, j int) bool { return report.Tutors[i].TutorName < report.Tutors[j].TutorName })

	report.QuestionPoolFee = int(math.Round(questionPool))
	report.TotalTutorFee += report.QuestionPoolFee
	report.Notes = []string{
		"Fee per peserta per kelas = total yang dibayar peserta x % fee tutor paketnya / jumlah kelas paket.",
		"Hanya kelas yang sudah selesai yang dihitung; minimum Rp200.000 per kelas.",
		"Bonus 10% fee kelas bila rata-rata rating tutor di gelombang ini minimal 4,7.",
		"Mentoring dihitung dari slot berstatus DONE x fee mentoring paket peserta.",
		"Pool soal = total pembayaran paket tanpa kelas x % fee paket tersebut; dibagi ke penyusun soal di luar laporan ini.",
		"Nilai bruto, sebelum pajak penghasilan tutor.",
	}
	return report, nil
}
