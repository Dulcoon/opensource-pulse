package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"opensource-pulse/api/internal/services"
)

type HealthHandler struct {
	svc *services.HealthService
}

func NewHealthHandler(svc *services.HealthService) *HealthHandler {
	return &HealthHandler{svc: svc}
}

func (h *HealthHandler) CalculateHealth(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	score, err := h.svc.CalculateAndSave(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, score)
}
