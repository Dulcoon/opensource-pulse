package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"opensource-pulse/api/internal/services"
)

type RadarHandler struct {
	svc *services.RadarService
}

func NewRadarHandler(svc *services.RadarService) *RadarHandler {
	return &RadarHandler{svc: svc}
}

func (h *RadarHandler) GetRadar(c *gin.Context) {
	scores, err := h.svc.GetRadar(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, scores)
}