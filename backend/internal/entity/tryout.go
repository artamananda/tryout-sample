package entity

import (
	"time"

	"github.com/google/uuid"
)

type Tryout struct {
	TryoutID  uuid.UUID  `gorm:"primaryKey" json:"tryout_id"`
	Title     string     `json:"title"`
	Duration  int        `json:"duration"`
	StartTime time.Time  `json:"start_time"`
	EndTime   time.Time  `json:"end_time"`
	Questions []Question `gorm:"foreignKey:TryoutID" json:"questions"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (Tryout) TableName() string {
	return "tryouts"
}
