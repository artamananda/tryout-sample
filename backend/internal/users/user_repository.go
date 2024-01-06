package users

import (
	"context"
	"database/sql"
	"time"

	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/google/uuid"
)

type UserRepository struct {
}

func (repository *UserRepository) Create(ctx context.Context, tx *sql.Tx, user User) User {
	user_id := uuid.New()
	sql := "insert into users (user_id, username, name, email, password, role, created_at) values ($1, $2, $3, $4, $6, $7)"
	_, err := tx.ExecContext(ctx, sql, user_id, user.Username, user.Name, user.Email, user.Password, user.Role, time.Now())
	helper.PanicIfError(err)

	user.UserId = user_id
	user.CreatedAt = time.Now()

	return user
}
