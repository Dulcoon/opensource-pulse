package database

import (
	"os"

	"opensource-pulse/api/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewPostgres(cfg *config.Config) *gorm.DB {
	// Silence per-query SQL logging in production (GIN_MODE=release):
	// with ~26 queries per dashboard call it is pure overhead there.
	logLevel := logger.Info
	if os.Getenv("GIN_MODE") == "release" {
		logLevel = logger.Error
	}
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		panic("failed to connect database: " + err.Error())
	}
	return db
}