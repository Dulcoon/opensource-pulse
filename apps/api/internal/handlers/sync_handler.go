package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"opensource-pulse/api/internal/services"
)

type SyncHandler struct {
	svc *services.SyncService
}

func NewSyncHandler(svc *services.SyncService) *SyncHandler {
	return &SyncHandler{svc: svc}
}

func (h *SyncHandler) SyncRepositories(c *gin.Context) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()
		h.svc.SyncRepositories(ctx)
	}()
	c.JSON(http.StatusAccepted, gin.H{"message": "sync started"})
}

func (h *SyncHandler) BackfillHistory(c *gin.Context) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()
		h.svc.BackfillHistoricalSnapshots(ctx)
	}()
	c.JSON(http.StatusAccepted, gin.H{"message": "historical stargazers backfill process initiated in background"})
}