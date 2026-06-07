package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"opensource-pulse/api/internal/services"
)

type AnalyticsHandler struct {
	svc *services.AnalyticsService
}

func NewAnalyticsHandler(svc *services.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{svc: svc}
}

func (h *AnalyticsHandler) GetAnalytics(c *gin.Context) {
	data := h.svc.GetAnalytics(c.Request.Context())
	c.JSON(http.StatusOK, data)
}