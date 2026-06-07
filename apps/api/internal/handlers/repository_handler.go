package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"opensource-pulse/api/internal/services"
)

type RepositoryHandler struct {
	svc *services.RepositoryService
}

func NewRepositoryHandler(svc *services.RepositoryService) *RepositoryHandler {
	return &RepositoryHandler{svc: svc}
}

func (h *RepositoryHandler) ListRepositories(c *gin.Context) {
	query := c.Query("q")
	language := c.Query("language")

	repos, err := h.svc.ListRepositories(c.Request.Context(), query, language)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, repos)
}

func (h *RepositoryHandler) GetRepository(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	repo, err := h.svc.GetRepository(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "repository not found"})
		return
	}
	c.JSON(http.StatusOK, repo)
}

func (h *RepositoryHandler) GetSummary(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	summary, err := h.svc.GetSummary(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "summary not found"})
		return
	}
	c.JSON(http.StatusOK, summary)
}