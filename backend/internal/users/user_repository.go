package users

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/google/uuid"
)

type UserRepository struct {
}

func (repository *UserRepository) Create(ctx context.Context, tx *sql.Tx, user UserModel) UserModel {
	user_id := uuid.New()
	sql := "INSERT INTO users (user_id, username, name, email, password, role, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)"
	_, err := tx.ExecContext(ctx, sql, user_id, user.Username, user.Name, user.Email, user.Password, user.Role, time.Now())
	helper.PanicIfError(err)

	user.UserId = user_id
	user.CreatedAt = time.Now()

	return user
}

func (repository *UserRepository) Update(ctx context.Context, tx *sql.Tx, user UserModel) UserModel {
	sql := "UPDATE users SET username=$1, name=$2, email=$3, password=$4, role=$5, updated_at=$6 WHERE user_id=$7"
	_, err := tx.ExecContext(ctx, sql, user.Username, user.Name, user.Email, user.Password, user.Role, time.Now(), user.UserId)
	helper.PanicIfError(err)

	user.UpdatedAt = time.Now()

	return user
}

func (repository *UserRepository) Delete(ctx context.Context, tx *sql.Tx, user UserModel) {
	sql := "DELETE FROM users WHERE user_id=$1"
	_, err := tx.ExecContext(ctx, sql, user.UserId)
	helper.PanicIfError(err)
}

func (repository *UserRepository) FindById(ctx context.Context, tx *sql.Tx, userId uuid.UUID) (UserModel, error) {
	sql := "SELECT * FROM users WHERE user_id=$1"
	rows, err := tx.QueryContext(ctx, sql, userId)
	helper.PanicIfError(err)
	user := UserModel{}
	if rows.Next() {
		err := rows.Scan(&user.UserId, &user.Username, &user.Name, &user.Email, &user.Password, &user.Role, &user.CreatedAt, &user.UpdatedAt)
		helper.PanicIfError(err)
		return user, nil
	} else {
		return user, errors.New("user is not found")
	}
}

func (repository *UserRepository) FindAll(ctx context.Context, tx *sql.Tx) []UserModel {
	sql := "SELECT * FROM users"
	rows, err := tx.QueryContext(ctx, sql)
	helper.PanicIfError(err)
	defer rows.Close()

	users := []UserModel{}
	for rows.Next() {
		user := UserModel{}
		err := rows.Scan(&user.UserId, &user.Username, &user.Name, &user.Email, &user.Password, &user.Role, &user.CreatedAt, &user.UpdatedAt)
		helper.PanicIfError(err)
		users = append(users, user)
	}

	return users
}
