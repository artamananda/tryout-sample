package config

import (
	"fmt"
	"log"
	"math/rand"
	"os"
	"strconv"
	"time"

	"github.com/artamananda/tryout-sample/internal/exception"
	_ "github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewDB(config Config) *gorm.DB {
	username := config.Get("DB_USER")
	password := config.Get("DB_PASSWORD")
	host := config.Get("DB_HOST")
	port := config.Get("DB_PORT")
	dbName := config.Get("DB_NAME")
	maxPoolOpen, err := strconv.Atoi(config.Get("DB_POOL_MAX_CONN"))
	maxPoolIdle, err := strconv.Atoi(config.Get("DB_POOL_IDLE_CONN"))
	maxPollLifeTime, err := strconv.Atoi(config.Get("DB_POOL_LIFE_TIME"))
	exception.PanicLogging(err)

	loggerDb := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta",
		host, username, password, dbName, port,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: loggerDb,
	})
	exception.PanicLogging(err)

	sqlDB, err := db.DB()
	exception.PanicLogging(err)

	sqlDB.SetMaxOpenConns(maxPoolOpen)
	sqlDB.SetMaxIdleConns(maxPoolIdle)
	sqlDB.SetConnMaxLifetime(time.Duration(rand.Int31n(int32(maxPollLifeTime))) * time.Millisecond)

	//autoMigrate
	//err = db.AutoMigrate(&entity.Product{})
	//err = db.AutoMigrate(&entity.Transaction{})
	//err = db.AutoMigrate(&entity.TransactionDetail{})
	//err = db.AutoMigrate(&entity.User{})
	//err = db.AutoMigrate(&entity.UserRole{})
	//exception.PanicLogging(err)
	return db
}
