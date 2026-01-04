package repository

import (
	"context"

	"github.com/artamananda/tryout-sample/internal/entity"
	"gorm.io/gorm"
)

type ChatArtifactRepository struct {
	DB *gorm.DB
}

func NewChatArtifactRepository(db *gorm.DB) ChatArtifactRepository {
	return ChatArtifactRepository{DB: db}
}

func (r *ChatArtifactRepository) Create(ctx context.Context, artifact *entity.ChatArtifact) error {
	return r.DB.WithContext(ctx).Create(artifact).Error
}

func (r *ChatArtifactRepository) FindByChatLogID(ctx context.Context, chatLogID string) ([]entity.ChatArtifact, error) {
	var artifacts []entity.ChatArtifact
	err := r.DB.WithContext(ctx).Where("chat_log_id = ?", chatLogID).Order("created_at asc").Find(&artifacts).Error
	return artifacts, err
}

func (r *ChatArtifactRepository) Update(ctx context.Context, artifact *entity.ChatArtifact) error {
	return r.DB.WithContext(ctx).Save(artifact).Error
}

func (r *ChatArtifactRepository) FindByID(ctx context.Context, id string) (*entity.ChatArtifact, error) {
	var artifact entity.ChatArtifact
	err := r.DB.WithContext(ctx).Where("id = ?", id).First(&artifact).Error
	if err != nil {
		return nil, err
	}
	return &artifact, nil
}

func (r *ChatArtifactRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&entity.ChatArtifact{}, "id = ?", id).Error
}
