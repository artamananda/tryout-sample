package entity

import (
	"time"

	"github.com/google/uuid"
)

type TryoutResultCache struct {
	TryoutID    uuid.UUID `gorm:"primaryKey" json:"tryout_id"`
	Payload     []byte    `gorm:"type:jsonb" json:"payload"`
	GeneratedAt time.Time `json:"generated_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (TryoutResultCache) TableName() string {
	return "tryout_result_caches"
}
