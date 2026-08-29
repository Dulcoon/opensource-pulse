package services

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"opensource-pulse/api/internal/config"
	"opensource-pulse/api/internal/domain/user"
	"opensource-pulse/api/internal/repositories"
)

type AuthService struct {
	cfg      *config.Config
	userRepo *repositories.UserRepo
	jwtKey   []byte
}

type Claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func NewAuthService(cfg *config.Config, userRepo *repositories.UserRepo) *AuthService {
	return &AuthService{
		cfg:      cfg,
		userRepo: userRepo,
		jwtKey:   []byte("opensource_pulse_jwt_secret_key_2026"),
	}
}

// SeedAdminUser automatically seeds admin@pulse.com / admin123 if not already present
func (s *AuthService) SeedAdminUser(ctx context.Context) error {
	existing, err := s.userRepo.FindByEmail(ctx, "admin@pulse.com")
	if err == nil && existing != nil {
		log.Println("[Auth] Admin user (admin@pulse.com) already exists")
		return nil
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	admin := &user.User{
		Email:     "admin@pulse.com",
		Password:  string(hashedPassword),
		Name:      "System Administrator",
		Role:      "admin",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.userRepo.Create(ctx, admin); err != nil {
		return fmt.Errorf("create admin: %w", err)
	}

	log.Println("[Auth] Successfully seeded admin user: admin@pulse.com / admin123")
	return nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*user.LoginResponse, error) {
	u, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	token, err := s.generateToken(u)
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	return &user.LoginResponse{
		Token: token,
		User:  *u,
	}, nil
}

func (s *AuthService) generateToken(u *user.User) (string, error) {
	expirationTime := time.Now().Add(7 * 24 * time.Hour) // 7 days valid
	claims := &Claims{
		UserID: u.ID,
		Email:  u.Email,
		Role:   u.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "opensource-pulse",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtKey)
}

func (s *AuthService) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtKey, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

func (s *AuthService) GetUserByID(ctx context.Context, id uint) (*user.User, error) {
	return s.userRepo.FindByID(ctx, id)
}
