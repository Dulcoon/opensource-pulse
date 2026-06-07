package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"opensource-pulse/api/internal/services"
)

type AIHandler struct {
	svc *services.AIService
}

func NewAIHandler(svc *services.AIService) *AIHandler {
	return &AIHandler{svc: svc}
}

func (h *AIHandler) GenerateSummary(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Minute)
	defer cancel()

	result, err := h.svc.GenerateSummary(ctx, uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
			"hint":  "Cek OPENROUTER_API_KEY di .env atau kuota harian",
		})
		return
	}

	c.JSON(http.StatusOK, result)
}
