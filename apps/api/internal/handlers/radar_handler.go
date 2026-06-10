package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"opensource-pulse/api/internal/services"
)

type RadarHandler struct {
	svc    *services.RadarService
	calc   *services.RadarCalculator
}

func NewRadarHandler(svc *services.RadarService, calc *services.RadarCalculator) *RadarHandler {
	return &RadarHandler{svc: svc, calc: calc}
}

func (h *RadarHandler) GetRadar(c *gin.Context) {
	scores, err := h.svc.GetRadar(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, scores)
}

func (h *RadarHandler) CalculateRadar(c *gin.Context) {
	err := h.calc.Calculate(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Tech Radar calculated"})
}
