package service

import (
	"context"
	"math"
	"sort"
	"strconv"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ---- response types

type AnalyticsKPI struct {
	Value    float64  `json:"value"`
	Previous *float64 `json:"previous,omitempty"`
}

type AnalyticsPoint struct {
	Date    string `json:"date"`
	Revenue int    `json:"revenue"`
	Orders  int    `json:"orders"`
	Users   int    `json:"users"`
}

type AnalyticsCount struct {
	Label   string `json:"label"`
	Count   int    `json:"count"`
	Revenue int    `json:"revenue,omitempty"`
}

type AnalyticsHeatCell struct {
	Weekday int `json:"weekday"` // 0 = Sunday
	Hour    int `json:"hour"`
	Count   int `json:"count"`
}

type AnalyticsTryout struct {
	TryoutID     string  `json:"tryout_id"`
	Title        string  `json:"title"`
	Sequence     int     `json:"sequence"`
	Participants int     `json:"participants"`
	AvgTWK       float64 `json:"avg_twk"`
	AvgTIU       float64 `json:"avg_tiu"`
	AvgTKP       float64 `json:"avg_tkp"`
	AvgTotal     float64 `json:"avg_total"`
	PassRate     float64 `json:"pass_rate"`
}

type AnalyticsClass struct {
	Sequence   int     `json:"sequence"`
	Title      string  `json:"title"`
	StartsAt   string  `json:"starts_at"`
	Entitled   int     `json:"entitled"`
	Attendees  int     `json:"attendees"`
	RatingAvg  float64 `json:"rating_avg"`
	RatingsCnt int     `json:"rating_count"`
}

type AnalyticsResponse struct {
	From      string `json:"from"`
	To        string `json:"to"`
	Days      int    `json:"days"`
	ProgramID string `json:"program_id,omitempty"`

	KPIs map[string]AnalyticsKPI `json:"kpis"`

	Daily             []AnalyticsPoint    `json:"daily"`
	OrdersByStatus    []AnalyticsCount    `json:"orders_by_status"`
	RevenueByPackage  []AnalyticsCount    `json:"revenue_by_package"`
	PaymentMethods    []AnalyticsCount    `json:"payment_methods"`
	Funnel            []AnalyticsCount    `json:"funnel"`
	Provinces         []AnalyticsCount    `json:"provinces"`
	Education         []AnalyticsCount    `json:"education"`
	Gender            []AnalyticsCount    `json:"gender"`
	OrdersHeatmap     []AnalyticsHeatCell `json:"orders_heatmap"`
	Tryouts           []AnalyticsTryout   `json:"tryouts"`
	ScoreDistribution []AnalyticsCount    `json:"score_distribution"`
	SubtestPassRates  []AnalyticsCount    `json:"subtest_pass_rates"`
	Classes           []AnalyticsClass    `json:"classes"`
	Mentoring         []AnalyticsCount    `json:"mentoring"`
	Referrals         map[string]int      `json:"referrals"`
	GeneratedAt       time.Time           `json:"generated_at"`
}

type AnalyticsService struct {
	DB                  *gorm.DB
	TryoutRepository    *repository.TryoutRepository
	LiveClassRepository *repository.LiveClassRepository
	SKDResultService    *SKDResultService
	Now                 func() time.Time
}

const analyticsTZ = "Asia/Jakarta"

func round2(value float64) float64 { return math.Round(value*100) / 100 }

// scope adds the optional program filter on a column.
func scope(query *gorm.DB, column string, programID *uuid.UUID) *gorm.DB {
	if programID != nil {
		return query.Where(column+" = ?", *programID)
	}
	return query
}

// Overview builds every figure of the CMS dashboard for the last `days` days
// (WIB), optionally for one program. Previous-period values cover the same
// number of days before `from`.
func (service *AnalyticsService) Overview(ctx context.Context, programIDText string, days int) (AnalyticsResponse, error) {
	if days <= 0 || days > 366 {
		days = 30
	}
	var programID *uuid.UUID
	if programIDText != "" {
		id, err := parseID(programIDText, "program_id")
		if err != nil {
			return AnalyticsResponse{}, err
		}
		programID = &id
	}

	now := service.Now().In(wib)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, wib)
	from := today.AddDate(0, 0, -(days - 1))
	to := today.AddDate(0, 0, 1)
	prevFrom := from.AddDate(0, 0, -days)
	db := service.DB.WithContext(ctx)

	response := AnalyticsResponse{
		From:        from.Format("2006-01-02"),
		To:          today.Format("2006-01-02"),
		Days:        days,
		KPIs:        map[string]AnalyticsKPI{},
		Referrals:   map[string]int{},
		GeneratedAt: service.Now(),
	}
	if programID != nil {
		response.ProgramID = programID.String()
	}

	// ---- KPIs with previous period
	type periodTotals struct {
		Revenue int
		Orders  int
	}
	paidTotals := func(start, end time.Time) (periodTotals, error) {
		var totals periodTotals
		query := db.Model(&entity.Order{}).
			Select("COALESCE(SUM(amount),0) AS revenue, COUNT(*) FILTER (WHERE amount > 0) AS orders").
			Where("status = ? AND paid_at >= ? AND paid_at < ?", entity.OrderPaid, start, end)
		err := scope(query, "program_id", programID).Scan(&totals).Error
		return totals, err
	}
	current, err := paidTotals(from, to)
	if err != nil {
		return response, err
	}
	previous, err := paidTotals(prevFrom, from)
	if err != nil {
		return response, err
	}
	countUsers := func(start, end time.Time) (int64, error) {
		var count int64
		err := db.Model(&entity.User{}).Where("role = ? AND created_at >= ? AND created_at < ?", "user", start, end).Count(&count).Error
		return count, err
	}
	newUsers, err := countUsers(from, to)
	if err != nil {
		return response, err
	}
	prevUsers, err := countUsers(prevFrom, from)
	if err != nil {
		return response, err
	}
	kpi := func(name string, value float64, prev *float64) {
		response.KPIs[name] = AnalyticsKPI{Value: round2(value), Previous: prev}
	}
	f := func(v float64) *float64 { r := round2(v); return &r }
	kpi("revenue", float64(current.Revenue), f(float64(previous.Revenue)))
	kpi("paid_orders", float64(current.Orders), f(float64(previous.Orders)))
	kpi("new_users", float64(newUsers), f(float64(prevUsers)))
	aov := 0.0
	if current.Orders > 0 {
		aov = float64(current.Revenue) / float64(current.Orders)
	}
	prevAov := 0.0
	if previous.Orders > 0 {
		prevAov = float64(previous.Revenue) / float64(previous.Orders)
	}
	kpi("avg_order_value", aov, f(prevAov))

	var members int64
	if err := scope(db.Model(&entity.TransactionProgram{}).Where("status IN ?", []string{"PAID", "COMPLETED"}), "program_id", programID).
		Distinct("user_id").Count(&members).Error; err != nil {
		return response, err
	}
	kpi("participants", float64(members), nil)

	var pending int64
	if err := scope(db.Model(&entity.Order{}).Where("status = ? AND (expires_at IS NULL OR expires_at > ?)", entity.OrderPending, now), "program_id", programID).
		Count(&pending).Error; err != nil {
		return response, err
	}
	kpi("pending_orders", float64(pending), nil)

	// ---- daily series (zero-filled)
	type dayRow struct {
		Day     time.Time
		Revenue int
		Orders  int
	}
	var revenueRows []dayRow
	if err := scope(db.Model(&entity.Order{}).
		Select("date_trunc('day', paid_at AT TIME ZONE ?) AS day, COALESCE(SUM(amount),0) AS revenue, COUNT(*) AS orders", analyticsTZ).
		Where("status = ? AND paid_at >= ? AND paid_at < ?", entity.OrderPaid, from, to), "program_id", programID).
		Group("day").Scan(&revenueRows).Error; err != nil {
		return response, err
	}
	var userRows []struct {
		Day   time.Time
		Count int
	}
	if err := db.Model(&entity.User{}).
		Select("date_trunc('day', created_at AT TIME ZONE ?) AS day, COUNT(*) AS count", analyticsTZ).
		Where("role = ? AND created_at >= ? AND created_at < ?", "user", from, to).
		Group("day").Scan(&userRows).Error; err != nil {
		return response, err
	}
	// One point per day, including days without activity.
	index := map[string]int{}
	for day := from; day.Before(to); day = day.AddDate(0, 0, 1) {
		key := day.Format("2006-01-02")
		index[key] = len(response.Daily)
		response.Daily = append(response.Daily, AnalyticsPoint{Date: key})
	}
	for _, row := range revenueRows {
		if i, ok := index[row.Day.Format("2006-01-02")]; ok {
			response.Daily[i].Revenue = row.Revenue
			response.Daily[i].Orders = row.Orders
		}
	}
	for _, row := range userRows {
		if i, ok := index[row.Day.Format("2006-01-02")]; ok {
			response.Daily[i].Users = row.Count
		}
	}

	// ---- orders by status (in range), revenue by package, payment methods
	var statusRows []AnalyticsCount
	if err := scope(db.Model(&entity.Order{}).
		Select("status AS label, COUNT(*) AS count, COALESCE(SUM(amount) FILTER (WHERE status = 'PAID'),0) AS revenue").
		Where("created_at >= ? AND created_at < ?", from, to), "program_id", programID).
		Group("status").Order("count DESC").Scan(&statusRows).Error; err != nil {
		return response, err
	}
	response.OrdersByStatus = statusRows

	var packageRows []AnalyticsCount
	if err := scope(db.Table("orders").
		Select("packages.name AS label, COUNT(*) AS count, COALESCE(SUM(orders.amount),0) AS revenue").
		Joins("JOIN packages ON packages.package_id = orders.package_id").
		Where("orders.status = ? AND orders.paid_at >= ? AND orders.paid_at < ?", entity.OrderPaid, from, to), "orders.program_id", programID).
		Group("packages.name, packages.sort_order").Order("packages.sort_order").Scan(&packageRows).Error; err != nil {
		return response, err
	}
	response.RevenueByPackage = packageRows

	var methodRows []AnalyticsCount
	if err := scope(db.Model(&entity.Order{}).
		Select("COALESCE(NULLIF(payment_method,''), payment_provider) AS label, COUNT(*) AS count, COALESCE(SUM(amount),0) AS revenue").
		Where("status = ? AND paid_at >= ? AND paid_at < ?", entity.OrderPaid, from, to), "program_id", programID).
		Group("label").Order("count DESC").Scan(&methodRows).Error; err != nil {
		return response, err
	}
	response.PaymentMethods = methodRows

	// ---- funnel (all time, users with role user)
	funnelCount := func(query *gorm.DB) int {
		var count int64
		query.Count(&count)
		return int(count)
	}
	registered := funnelCount(db.Model(&entity.User{}).Where("role = ?", "user"))
	withPhone := funnelCount(db.Model(&entity.User{}).Where("role = ? AND phone_number IS NOT NULL AND phone_number <> ''", "user"))
	ordered := funnelCount(scope(db.Model(&entity.Order{}), "program_id", programID).Distinct("user_id"))
	paidUsers := funnelCount(scope(db.Model(&entity.Order{}).Where("status = ?", entity.OrderPaid), "program_id", programID).Distinct("user_id"))
	tryoutScope := db.Model(&entity.TransactionTryout{}).Joins("JOIN tryouts ON tryouts.tryout_id = transaction_tryouts.tryout_id")
	if programID != nil {
		tryoutScope = tryoutScope.Where("tryouts.program_id = ?", *programID)
	}
	started := funnelCount(tryoutScope.Session(&gorm.Session{}).Where("transaction_tryouts.status IN ?", []string{"PAID", "COMPLETED"}).Distinct("transaction_tryouts.user_id"))
	completed := funnelCount(tryoutScope.Session(&gorm.Session{}).Where("transaction_tryouts.status = ?", "COMPLETED").Distinct("transaction_tryouts.user_id"))
	response.Funnel = []AnalyticsCount{
		{Label: "Akun terdaftar", Count: registered},
		{Label: "Isi nomor WA", Count: withPhone},
		{Label: "Membuat pesanan", Count: ordered},
		{Label: "Pesanan lunas", Count: paidUsers},
		{Label: "Mulai tryout", Count: started},
		{Label: "Selesai tryout", Count: completed},
	}

	// ---- demographics of participants (members of the program, or all users)
	demographic := func(column string, fallback string, limit int) ([]AnalyticsCount, error) {
		var rows []AnalyticsCount
		query := db.Table("users").
			Select("COALESCE(NULLIF(users."+column+",''), ?) AS label, COUNT(DISTINCT users.user_id) AS count", fallback).
			Where("users.role = ?", "user")
		if programID != nil {
			query = query.Joins("JOIN transaction_programs tp ON tp.user_id = users.user_id AND tp.status IN ?", []string{"PAID", "COMPLETED"}).
				Where("tp.program_id = ?", *programID)
		}
		query = query.Group("label").Order("count DESC")
		if limit > 0 {
			query = query.Limit(limit)
		}
		err := query.Scan(&rows).Error
		return rows, err
	}
	if response.Provinces, err = demographic("province", "Belum diisi", 12); err != nil {
		return response, err
	}
	if response.Education, err = demographic("last_education", "Belum diisi", 0); err != nil {
		return response, err
	}
	if response.Gender, err = demographic("gender", "Belum diisi", 0); err != nil {
		return response, err
	}
	for i := range response.Gender {
		switch response.Gender[i].Label {
		case "male":
			response.Gender[i].Label = "Laki-laki"
		case "female":
			response.Gender[i].Label = "Perempuan"
		}
	}

	// ---- when people buy (weekday x hour, WIB), paid orders in range
	var heat []AnalyticsHeatCell
	if err := scope(db.Model(&entity.Order{}).
		Select("EXTRACT(DOW FROM created_at AT TIME ZONE ?)::int AS weekday, EXTRACT(HOUR FROM created_at AT TIME ZONE ?)::int AS hour, COUNT(*) AS count", analyticsTZ, analyticsTZ).
		Where("created_at >= ? AND created_at < ?", from, to), "program_id", programID).
		Group("weekday, hour").Scan(&heat).Error; err != nil {
		return response, err
	}
	response.OrdersHeatmap = heat

	// ---- SKD results per tryout
	if err := service.addSKD(ctx, &response, programID); err != nil {
		return response, err
	}

	// ---- live classes
	if programID != nil {
		if err := service.addClasses(ctx, &response, *programID); err != nil {
			return response, err
		}
	}

	// ---- mentoring
	var mentoring []AnalyticsCount
	if err := scope(db.Model(&entity.MentoringSlot{}).Select("status AS label, COUNT(*) AS count"), "program_id", programID).
		Group("status").Order("count DESC").Scan(&mentoring).Error; err != nil {
		return response, err
	}
	response.Mentoring = mentoring

	// ---- referrals
	var referral struct {
		Orders   int
		Discount int
	}
	if err := scope(db.Model(&entity.Order{}).
		Select("COUNT(*) AS orders, COALESCE(SUM(discount),0) AS discount").
		Where("status = ? AND referrer_user_id IS NOT NULL", entity.OrderPaid), "program_id", programID).
		Scan(&referral).Error; err != nil {
		return response, err
	}
	var bonus int
	if err := scope(db.Model(&entity.ReferralReward{}).Select("COALESCE(SUM(bonus_tryouts),0)"), "program_id", programID).Scan(&bonus).Error; err != nil {
		return response, err
	}
	response.Referrals["paid_orders"] = referral.Orders
	response.Referrals["discount_total"] = referral.Discount
	response.Referrals["bonus_tryouts"] = bonus

	return response, nil
}

func (service *AnalyticsService) addSKD(ctx context.Context, response *AnalyticsResponse, programID *uuid.UUID) error {
	var tryouts []entity.Tryout
	query := service.DB.WithContext(ctx).Where("scoring_mode = ?", entity.ScoringModeSKD)
	if programID != nil {
		query = query.Where("program_id = ?", *programID)
	}
	// Latest 12 SKD tryouts, shown in TO order.
	if err := query.Order("start_time DESC").Limit(12).Find(&tryouts).Error; err != nil {
		return err
	}
	sort.Slice(tryouts, func(i, j int) bool {
		if tryouts[i].Sequence != tryouts[j].Sequence {
			return tryouts[i].Sequence < tryouts[j].Sequence
		}
		return tryouts[i].StartTime.Before(tryouts[j].StartTime)
	})

	buckets := make([]int, 11) // 0-49, 50-99, ..., 500-550
	passed := map[string]int{}
	scored := 0
	for _, tryout := range tryouts {
		ranking, err := service.SKDResultService.ranking(ctx, tryout.TryoutID.String())
		if err != nil {
			return err
		}
		item := AnalyticsTryout{TryoutID: tryout.TryoutID.String(), Title: tryout.Title, Sequence: tryout.Sequence, Participants: len(ranking.Participants)}
		if len(ranking.Participants) > 0 {
			var twk, tiu, tkp, total, pass float64
			for _, participant := range ranking.Participants {
				twk += float64(participant.Score.ByCode["twk"])
				tiu += float64(participant.Score.ByCode["tiu"])
				tkp += float64(participant.Score.ByCode["tkp"])
				total += float64(participant.Score.Total)
				if participant.Score.PassedAll {
					pass++
				}
				for _, subtest := range participant.Score.Subtests {
					if subtest.Passed {
						passed[subtest.Code]++
					}
				}
				bucket := participant.Score.Total / 50
				if bucket > 10 {
					bucket = 10
				}
				if bucket < 0 {
					bucket = 0
				}
				buckets[bucket]++
				scored++
			}
			n := float64(len(ranking.Participants))
			item.AvgTWK, item.AvgTIU, item.AvgTKP = round2(twk/n), round2(tiu/n), round2(tkp/n)
			item.AvgTotal = round2(total / n)
			item.PassRate = round2(pass / n * 100)
		}
		response.Tryouts = append(response.Tryouts, item)
	}

	for i, count := range buckets {
		label := strconv.Itoa(i*50) + "–" + strconv.Itoa(i*50+49)
		if i == 10 {
			label = "500+"
		}
		response.ScoreDistribution = append(response.ScoreDistribution, AnalyticsCount{Label: label, Count: count})
	}
	for _, subtest := range SKDSubtests {
		rate := 0
		if scored > 0 {
			rate = int(math.Round(float64(passed[subtest.Code]) / float64(scored) * 100))
		}
		response.SubtestPassRates = append(response.SubtestPassRates, AnalyticsCount{Label: subtest.Code, Count: rate})
	}

	totalScored, totalScore, passAll := 0.0, 0.0, 0.0
	for _, item := range response.Tryouts {
		totalScored += float64(item.Participants)
		totalScore += item.AvgTotal * float64(item.Participants)
		passAll += item.PassRate / 100 * float64(item.Participants)
	}
	if totalScored > 0 {
		response.KPIs["avg_skd_score"] = AnalyticsKPI{Value: round2(totalScore / totalScored)}
		response.KPIs["pass_rate"] = AnalyticsKPI{Value: round2(passAll / totalScored * 100)}
	} else {
		response.KPIs["avg_skd_score"] = AnalyticsKPI{}
		response.KPIs["pass_rate"] = AnalyticsKPI{}
	}
	response.KPIs["tryout_completions"] = AnalyticsKPI{Value: totalScored}
	return nil
}

func (service *AnalyticsService) addClasses(ctx context.Context, response *AnalyticsResponse, programID uuid.UUID) error {
	classes, err := service.LiveClassRepository.FindByPrograms(ctx, []uuid.UUID{programID})
	if err != nil {
		return err
	}
	ids := make([]uuid.UUID, 0, len(classes))
	for _, class := range classes {
		ids = append(ids, class.ClassID)
	}
	stats, err := service.LiveClassRepository.Stats(ctx, ids)
	if err != nil {
		return err
	}

	// Participants entitled to class k = members whose package has class_count >= k.
	var entitlements []struct {
		ClassCount int
		Members    int
	}
	if err := service.DB.WithContext(ctx).Table("transaction_programs tp").
		Select("packages.class_count AS class_count, COUNT(*) AS members").
		Joins("JOIN packages ON packages.package_id = tp.package_id").
		Where("tp.program_id = ? AND tp.status IN ?", programID, []string{"PAID", "COMPLETED"}).
		Group("packages.class_count").Scan(&entitlements).Error; err != nil {
		return err
	}

	totalEntitled, totalAttended, ratingSum, ratingCount := 0, 0, 0.0, 0
	now := service.Now()
	for _, class := range classes {
		entitled := 0
		for _, row := range entitlements {
			if row.ClassCount >= class.Sequence {
				entitled += row.Members
			}
		}
		stat := stats[class.ClassID]
		response.Classes = append(response.Classes, AnalyticsClass{
			Sequence:   class.Sequence,
			Title:      class.Title,
			StartsAt:   class.StartsAt.In(wib).Format("2006-01-02 15:04"),
			Entitled:   entitled,
			Attendees:  stat.Attendees,
			RatingAvg:  round2(stat.RatingAvg),
			RatingsCnt: stat.RatingCount,
		})
		if now.After(class.EndsAt) {
			totalEntitled += entitled
			totalAttended += stat.Attendees
		}
		ratingSum += stat.RatingAvg * float64(stat.RatingCount)
		ratingCount += stat.RatingCount
	}
	if totalEntitled > 0 {
		response.KPIs["attendance_rate"] = AnalyticsKPI{Value: round2(float64(totalAttended) / float64(totalEntitled) * 100)}
	}
	if ratingCount > 0 {
		response.KPIs["avg_class_rating"] = AnalyticsKPI{Value: round2(ratingSum / float64(ratingCount))}
	}
	return nil
}
