package cron

import (
	"log"
	"time"

	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/cron/jobs"
	"github.com/artamananda/tryout-sample/internal/repository"
	cronlib "github.com/robfig/cron/v3"
)

type Scheduler struct {
	cronRunner             *cronlib.Cron
	config                 config.Config
	bankSoalRepo           *repository.BankSoalRepository
	chatLogRepo            *repository.ChatLogRepository
	dailyChallengeRepo     *repository.DailyChallengeRepository
	questionStatisticsRepo *repository.QuestionStatisticsRepository
}

func NewScheduler(
	cfg config.Config,
	bankSoalRepo *repository.BankSoalRepository,
	chatLogRepo *repository.ChatLogRepository,
	dailyChallengeRepo *repository.DailyChallengeRepository,
	questionStatisticsRepo *repository.QuestionStatisticsRepository,
) *Scheduler {
	return &Scheduler{
		cronRunner:             cronlib.New(cronlib.WithLocation(getJakartaTimezone())),
		config:                 cfg,
		bankSoalRepo:           bankSoalRepo,
		chatLogRepo:            chatLogRepo,
		dailyChallengeRepo:     dailyChallengeRepo,
		questionStatisticsRepo: questionStatisticsRepo,
	}
}

func getJakartaTimezone() *time.Location {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		log.Printf("Failed to load Jakarta timezone, using UTC: %v", err)
		return time.UTC
	}
	return loc
}

func (s *Scheduler) Start() {
	log.Println("Starting cron scheduler...")

	// Job 1: Batch Question Extractor - 01:00 daily
	batchExtractor := jobs.NewBatchExtractor(s.config, s.chatLogRepo, s.bankSoalRepo)
	s.cronRunner.AddFunc("0 1 * * *", func() {
		log.Println("[Cron] Running Batch Extractor...")
		if err := batchExtractor.Run(); err != nil {
			log.Printf("[Cron] Batch Extractor error: %v", err)
		}
	})

	// Job 2: Auto Tagger - Every hour
	autoTagger := jobs.NewAutoTagger(s.config, s.bankSoalRepo)
	s.cronRunner.AddFunc("0 * * * *", func() {
		log.Println("[Cron] Running Auto Tagger...")
		if err := autoTagger.Run(); err != nil {
			log.Printf("[Cron] Auto Tagger error: %v", err)
		}
	})

	// Job 3: Deduplicator - 02:00 daily
	deduplicator := jobs.NewDeduplicator(s.bankSoalRepo)
	s.cronRunner.AddFunc("0 2 * * *", func() {
		log.Println("[Cron] Running Deduplicator...")
		if err := deduplicator.Run(); err != nil {
			log.Printf("[Cron] Deduplicator error: %v", err)
		}
	})

	// Job 4: Drip Publisher - 06:00 daily
	dripPublisher := jobs.NewDripPublisher(s.bankSoalRepo)
	s.cronRunner.AddFunc("0 6 * * *", func() {
		log.Println("[Cron] Running Drip Publisher...")
		if err := dripPublisher.Run(); err != nil {
			log.Printf("[Cron] Drip Publisher error: %v", err)
		}
	})

	// Job 5: Daily Challenge Generator - 00:00 daily
	challengeGenerator := jobs.NewChallengeGenerator(s.bankSoalRepo, s.dailyChallengeRepo)
	s.cronRunner.AddFunc("0 0 * * *", func() {
		log.Println("[Cron] Running Challenge Generator...")
		if err := challengeGenerator.Run(); err != nil {
			log.Printf("[Cron] Challenge Generator error: %v", err)
		}
	})

	// Job 6: Difficulty Calibrator - Sunday 23:00
	difficultyCalibrator := jobs.NewDifficultyCalibrator(s.bankSoalRepo, s.questionStatisticsRepo)
	s.cronRunner.AddFunc("0 23 * * 0", func() {
		log.Println("[Cron] Running Difficulty Calibrator...")
		if err := difficultyCalibrator.Run(); err != nil {
			log.Printf("[Cron] Difficulty Calibrator error: %v", err)
		}
	})

	s.cronRunner.Start()
	log.Println("Cron scheduler started with 6 jobs")
}

func (s *Scheduler) Stop() {
	log.Println("Stopping cron scheduler...")
	s.cronRunner.Stop()
}

// Manual trigger methods for testing
func (s *Scheduler) TriggerBatchExtractor() error {
	return jobs.NewBatchExtractor(s.config, s.chatLogRepo, s.bankSoalRepo).Run()
}

func (s *Scheduler) TriggerAutoTagger() error {
	return jobs.NewAutoTagger(s.config, s.bankSoalRepo).Run()
}

func (s *Scheduler) TriggerDeduplicator() error {
	return jobs.NewDeduplicator(s.bankSoalRepo).Run()
}

func (s *Scheduler) TriggerDripPublisher() error {
	return jobs.NewDripPublisher(s.bankSoalRepo).Run()
}

func (s *Scheduler) TriggerChallengeGenerator() error {
	return jobs.NewChallengeGenerator(s.bankSoalRepo, s.dailyChallengeRepo).Run()
}

func (s *Scheduler) TriggerDifficultyCalibrator() error {
	return jobs.NewDifficultyCalibrator(s.bankSoalRepo, s.questionStatisticsRepo).Run()
}
