package github

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"time"
)

type Client struct {
	token  string
	client *http.Client
}

type Repository struct {
	ID              int64     `json:"id"`
	Owner           Owner     `json:"owner"`
	Name            string    `json:"name"`
	FullName        string    `json:"full_name"`
	Description     *string   `json:"description"`
	Language        *string   `json:"language"`
	StargazersCount int       `json:"stargazers_count"`
	ForksCount      int       `json:"forks_count"`
	OpenIssuesCount int       `json:"open_issues_count"`
	WatchersCount   int       `json:"watchers_count"`
	HTMLURL         string    `json:"html_url"`
	DefaultBranch   string    `json:"default_branch"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	PushedAt        time.Time `json:"pushed_at"`
	Topics          []string  `json:"topics"`
}

type Owner struct {
	Login string `json:"login"`
}

type SearchResponse struct {
	Items []Repository `json:"items"`
}

type Contributor struct {
	Login         string `json:"login"`
	Contributions int    `json:"contributions"`
}

type Release struct {
	TagName     string    `json:"tag_name"`
	PublishedAt time.Time `json:"published_at"`
}

func NewClient(token string) *Client {
	return &Client{
		token: token,
		client: &http.Client{Timeout: 60 * time.Second},
	}
}

func (c *Client) SearchRepositories(ctx context.Context, query string, perPage int) ([]Repository, error) {
	base := "https://api.github.com/search/repositories"
	reqURL := fmt.Sprintf("%s?q=%s&sort=stars&order=desc&per_page=%d", base, url.QueryEscape(query), perPage)
	var resp SearchResponse
	if err := c.get(ctx, reqURL, &resp); err != nil {
		return nil, err
	}
	return resp.Items, nil
}

func (c *Client) GetRepository(ctx context.Context, owner, repo string) (*Repository, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repo)
	var resp Repository
	if err := c.get(ctx, url, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

func (c *Client) GetContributorsCount(ctx context.Context, owner, repo string) (int, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contributors?per_page=1&anon=true", owner, repo)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return 0, err
	}
	c.setHeaders(req)
	resp, err := c.client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	link := resp.Header.Get("Link")
	if link == "" {
		// Cuma 1 page -> 1 kontributor (karena per_page=1 & response ga kosong)
		return 1, nil
	}
	re := regexp.MustCompile(`page=(\d+)>; rel="last"`)
	matches := re.FindStringSubmatch(link)
	if len(matches) < 2 {
		return 1, nil
	}
	lastPage, _ := strconv.Atoi(matches[1])
	return lastPage, nil
}

func (c *Client) GetLatestRelease(ctx context.Context, owner, repo string) (*Release, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", owner, repo)
	var resp Release
	if err := c.get(ctx, url, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

func (c *Client) get(ctx context.Context, url string, dest interface{}) error {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return err
	}
	c.setHeaders(req)
	resp, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}
	return json.NewDecoder(resp.Body).Decode(dest)
}

func (c *Client) setHeaders(req *http.Request) {
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
}

// StargazerItem holds the timestamp when a star was created
type StargazerItem struct {
	StarredAt time.Time `json:"starred_at"`
}

// HistoricalStarPoint represents star count at a relative historical point
type HistoricalStarPoint struct {
	DaysAgo int
	Date    time.Time
	Stars   int
}

// GetHistoricalStarsAtDate estimates the cumulative star count for a repository at targetDate
// using logarithmic binary search over stargazers pages with Accept: application/vnd.github.v3.star+json.
func (c *Client) GetHistoricalStarsAtDate(ctx context.Context, owner, repo string, totalStars int, createdAt, targetDate time.Time) (int, error) {
	if totalStars <= 0 {
		return 0, nil
	}
	// If repo was created after targetDate, it had 0 stars
	if createdAt.After(targetDate) {
		return 0, nil
	}
	// If targetDate is within the last hour or in the future, return totalStars
	if !targetDate.Before(time.Now().Add(-1 * time.Hour)) {
		return totalStars, nil
	}

	const perPage = 100
	totalPages := (totalStars + perPage - 1) / perPage
	if totalPages <= 0 {
		totalPages = 1
	}

	// For small repos (<= 100 stars), page 1 contains all stargazers
	if totalPages == 1 {
		items, err := c.getStargazersPage(ctx, owner, repo, 1, perPage)
		if err != nil {
			return totalStars, err
		}
		count := 0
		for _, item := range items {
			if !item.StarredAt.After(targetDate) {
				count++
			}
		}
		return count, nil
	}

	// Binary search to find the page where StarredAt crosses targetDate
	low := 1
	high := totalPages
	bestPage := low

	// Limit to at most 5 binary search probes to conserve API rate limits
	for iter := 0; iter < 5 && low <= high; iter++ {
		mid := (low + high) / 2
		items, err := c.getStargazersPage(ctx, owner, repo, mid, perPage)
		if err != nil {
			break
		}
		if len(items) == 0 {
			high = mid - 1
			continue
		}

		firstStarAt := items[0].StarredAt
		if firstStarAt.Before(targetDate) || firstStarAt.Equal(targetDate) {
			bestPage = mid
			low = mid + 1
		} else {
			high = mid - 1
		}
	}

	estimatedStars := bestPage * perPage
	if estimatedStars > totalStars {
		estimatedStars = totalStars
	}
	if estimatedStars < 0 {
		estimatedStars = 0
	}
	return estimatedStars, nil
}

// GetHistoricalStarsMulti samples star counts across multiple past intervals (e.g. [7, 30, 90] days).
// It fails closed: if any probe fails, no points are returned, so callers
// never persist invented history. Synthesizing past numbers from a decay
// formula is forbidden — unobserved history must stay absent, not plausible.
func (c *Client) GetHistoricalStarsMulti(ctx context.Context, owner, repo string, totalStars int, createdAt time.Time, daysList []int) ([]HistoricalStarPoint, error) {
	now := time.Now()
	var results []HistoricalStarPoint
	for _, days := range daysList {
		targetDate := now.AddDate(0, 0, -days)
		stars, err := c.GetHistoricalStarsAtDate(ctx, owner, repo, totalStars, createdAt, targetDate)
		if err != nil {
			return nil, fmt.Errorf("historical stars probe failed for %s/%s (%dd ago): %w", owner, repo, days, err)
		}
		results = append(results, HistoricalStarPoint{
			DaysAgo: days,
			Date:    targetDate,
			Stars:   stars,
		})
	}
	return results, nil
}

func (c *Client) getStargazersPage(ctx context.Context, owner, repo string, page, perPage int) ([]StargazerItem, error) {
	reqURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/stargazers?per_page=%d&page=%d", owner, repo, perPage, page)
	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github.v3.star+json")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API stargazers returned status %d", resp.StatusCode)
	}

	var items []StargazerItem
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		return nil, err
	}
	return items, nil
}