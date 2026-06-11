package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"opensource-pulse/api/internal/services"
)

type InsightHandler struct {
	svc *services.InsightService
}

func NewInsightHandler(svc *services.InsightService) *InsightHandler {
	return &InsightHandler{svc: svc}
}

func (h *InsightHandler) GenerateInsight(c *gin.Context) {
	insight, err := h.svc.GenerateInsight(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, insight)
}
