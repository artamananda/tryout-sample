package entity

import (
	"time"

	"github.com/google/uuid"
)

type SystemConfig struct {
	ID          uuid.UUID `gorm:"primaryKey" json:"id"`
	Key         string    `gorm:"uniqueIndex" json:"key"`
	Value       string    `json:"value"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (SystemConfig) TableName() string {
	return "system_configs"
}
