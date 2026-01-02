package repository

import (
	"context"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChatLogRepository struct {
	*gorm.DB
}

func NewChatLogRepository(db *gorm.DB) ChatLogRepository {
	return ChatLogRepository{DB: db}
}

func (repo *ChatLogRepository) Create(ctx context.Context, chatLog entity.ChatLog) (entity.ChatLog, error) {
	chatLog.ChatLogID = uuid.New()
	err := repo.DB.WithContext(ctx).Create(&chatLog).Error
	if err != nil {
		return entity.ChatLog{}, err
	}
	return chatLog, nil
}

func (repo *ChatLogRepository) FindByID(ctx context.Context, id uuid.UUID) (entity.ChatLog, error) {
	var chatLog entity.ChatLog
	err := repo.DB.WithContext(ctx).Where("chat_log_id = ?", id).First(&chatLog).Error
	if err != nil {
		return entity.ChatLog{}, err
	}
	return chatLog, nil
}

func (repo *ChatLogRepository) FindByStatus(ctx context.Context, status string) ([]entity.ChatLog, error) {
	var chatLogs []entity.ChatLog
	err := repo.DB.WithContext(ctx).Where("status = ?", status).Order("created_at ASC").Find(&chatLogs).Error
	if err != nil {
		return nil, err
	}
	return chatLogs, nil
}

func (repo *ChatLogRepository) FindPending(ctx context.Context) ([]entity.ChatLog, error) {
	return repo.FindByStatus(ctx, entity.ChatLogStatusPending)
}

func (repo *ChatLogRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string, errorMsg string) error {
	updates := map[string]interface{}{
		"status":        status,
		"error_message": errorMsg,
	}
	if status == entity.ChatLogStatusProcessed {
		now := gorm.Expr("NOW()")
		updates["processed_at"] = now
	}
	return repo.DB.WithContext(ctx).Model(&entity.ChatLog{}).Where("chat_log_id = ?", id).Updates(updates).Error
}

func (repo *ChatLogRepository) Update(ctx context.Context, chatLog entity.ChatLog) error {
	return repo.DB.WithContext(ctx).Save(&chatLog).Error
}

func (repo *ChatLogRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return repo.DB.WithContext(ctx).Delete(&entity.ChatLog{}, "chat_log_id = ?", id).Error
}

func (repo *ChatLogRepository) FindByAdminID(ctx context.Context, adminID uuid.UUID) ([]entity.ChatLog, error) {
	var chatLogs []entity.ChatLog
	err := repo.DB.WithContext(ctx).Where("admin_id = ?", adminID).Order("created_at DESC").Find(&chatLogs).Error
	if err != nil {
		return nil, err
	}
	return chatLogs, nil
}
