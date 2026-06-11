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