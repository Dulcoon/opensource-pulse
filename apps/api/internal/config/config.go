package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort       string
	DatabaseURL      string
	RedisAddr        string
	RedisPassword    string
	RedisDB          int
	GitHubToken      string
	GroqKey          string
	OpenRouterKey    string
	TelegramToken    string
	TelegramChatID   string
	AsynqConcurrency int
}

func Load() *Config {
	godotenv.Load()

	return &Config{
		ServerPort:       getEnv("SERVER_PORT", "8080"),
		DatabaseURL:      getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/opensource_pulse?sslmode=disable"),
		RedisAddr:        getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword:    getEnv("REDIS_PASSWORD", ""),
		RedisDB:          getEnvInt("REDIS_DB", 0),
		GitHubToken:      os.Getenv("GITHUB_TOKEN"),
		GroqKey:          os.Getenv("GROQ_API_KEY"),
		OpenRouterKey:    os.Getenv("OPENROUTER_API_KEY"),
		TelegramToken:    os.Getenv("TELEGRAM_BOT_TOKEN"),
		TelegramChatID:   os.Getenv("TELEGRAM_CHAT_ID"),
		AsynqConcurrency: getEnvInt("ASYNQ_CONCURRENCY", 10),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if val := os.Getenv(key); val != "" {
		if i, err := strconv.Atoi(val); err == nil {
			return i
		}
	}
	return fallback
}