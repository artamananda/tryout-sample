package config

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/artamananda/tryout-sample/internal/exception"
)

func NewDB(config Config) *sql.DB {
	db_user := config.Get("DB_USER")
	db_password := config.Get("DB_PASSWORD")
	db_host := config.Get("DB_HOST")
	db_port := config.Get("DB_PORT")
	db_name := config.Get("DB_NAME")

	connStr := fmt.Sprintf("postgres://%s:%s%s:%s/%s?sslmode=disable", db_user, db_password, db_host, db_port, db_name)
	db, err := sql.Open("postgres", connStr)
	exception.PanicLogging(err)

	db.SetConnMaxIdleTime(5)
	db.SetMaxOpenConns(20)
	db.SetConnMaxLifetime(60 * time.Minute)
	db.SetConnMaxIdleTime(10 * time.Minute)
	return db
}
