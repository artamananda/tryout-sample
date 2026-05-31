package service

import (
	"context"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/repository"
)

type SystemConfigService struct {
	Repo *repository.SystemConfigRepository
}

func NewSystemConfigService(repo *repository.SystemConfigRepository) SystemConfigService {
	return SystemConfigService{Repo: repo}
}

func (s *SystemConfigService) GetAll(ctx context.Context) ([]entity.SystemConfig, error) {
	return s.Repo.FindAll(ctx)
}

func (s *SystemConfigService) GetByKey(ctx context.Context, key string) (entity.SystemConfig, error) {
	return s.Repo.FindByKey(ctx, key)
}

func (s *SystemConfigService) Set(ctx context.Context, key, value string) error {
	return s.Repo.Upsert(ctx, key, value)
}

// GetValue returns the value for a key, or empty string if not found
func (s *SystemConfigService) GetValue(ctx context.Context, key string) string {
	cfg, err := s.Repo.FindByKey(ctx, key)
	if err != nil {
		return ""
	}
	return cfg.Value
}
