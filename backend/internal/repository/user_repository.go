package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/google/uuid"
)

type UserRepository struct {
}

func (repository *UserRepository) Create(ctx context.Context, tx *sql.Tx, user model.UserModel) model.UserModel {
	user_id := uuid.New()
	sql := "INSERT INTO users (user_id, username, name, email, password, role, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)"
	_, err := tx.ExecContext(ctx, sql, user_id, user.Username, user.Name, user.Email, user.Password, user.Role, time.Now())
	exception.PanicLogging(err)

	user.UserId = user_id
	user.CreatedAt = time.Now()

	return user
}

func (repository *UserRepository) Update(ctx context.Context, tx *sql.Tx, user model.UserModel) model.UserModel {
	sql := "UPDATE users SET username=$1, name=$2, email=$3, password=$4, role=$5, updated_at=$6 WHERE user_id=$7"
	_, err := tx.ExecContext(ctx, sql, user.Username, user.Name, user.Email, user.Password, user.Role, time.Now(), user.UserId)
	exception.PanicLogging(err)

	user.UpdatedAt = time.Now()

	return user
}

func (repository *UserRepository) Delete(ctx context.Context, tx *sql.Tx, user model.UserModel) {
	sql := "DELETE FROM users WHERE user_id=$1"
	_, err := tx.ExecContext(ctx, sql, user.UserId)
	exception.PanicLogging(err)
}

func (repository *UserRepository) FindById(ctx context.Context, tx *sql.Tx, userId uuid.UUID) (model.UserModel, error) {
	sql := "SELECT * FROM users WHERE user_id=$1"
	rows, err := tx.QueryContext(ctx, sql, userId)
	exception.PanicLogging(err)
	user := model.UserModel{}
	if rows.Next() {
		err := rows.Scan(&user.UserId, &user.Username, &user.Name, &user.Email, &user.Password, &user.Role, &user.CreatedAt, &user.UpdatedAt)
		exception.PanicLogging(err)
		return user, nil
	} else {
		return user, errors.New("user is not found")
	}
}

func (repository *UserRepository) FindAll(ctx context.Context, tx *sql.Tx) []model.UserModel {
	sql := "SELECT * FROM users"
	rows, err := tx.QueryContext(ctx, sql)
	exception.PanicLogging(err)
	defer rows.Close()

	users := []model.UserModel{}
	for rows.Next() {
		user := model.UserModel{}
		err := rows.Scan(&user.UserId, &user.Username, &user.Name, &user.Email, &user.Password, &user.Role, &user.CreatedAt, &user.UpdatedAt)
		exception.PanicLogging(err)
		users = append(users, user)
	}

	return users
}
