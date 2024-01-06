package config

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/joho/godotenv"
)

func NewDB() *sql.DB {
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Error loading .env file")
	}

	db_user := os.Getenv("DB_USER")
	db_password := os.Getenv("DB_PASSWORD")
	db_host := os.Getenv("DB_HOST")
	db_port := os.Getenv("DB_PORT")
	db_name := os.Getenv("DB_NAME")

	connStr := fmt.Sprintf("postgres://%s:%s%s:%s/%s?sslmode=disable", db_user, db_password, db_host, db_port, db_name)
	db, err := sql.Open("postgres", connStr)
	helper.PanicIfError(err)

	db.SetConnMaxIdleTime(5)
	db.SetMaxOpenConns(20)
	db.SetConnMaxLifetime(60 * time.Minute)
	db.SetConnMaxIdleTime(10 * time.Minute)
	return db
}
