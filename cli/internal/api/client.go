package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"essay.sh/cli/internal/config"
)

type Client struct {
	base  string
	token string
}

func New() *Client {
	return &Client{
		base:  config.APIBase(),
		token: config.Token(),
	}
}

func (c *Client) do(method, path string, body any, out any) error {
	var buf *bytes.Buffer
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return err
		}
		buf = bytes.NewBuffer(b)
	} else {
		buf = &bytes.Buffer{}
	}

	req, err := http.NewRequest(method, c.base+path, buf)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		var e struct{ Error string }
		json.NewDecoder(resp.Body).Decode(&e)
		if e.Error != "" {
			return fmt.Errorf("%s", e.Error)
		}
		return fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	if out != nil {
		return json.NewDecoder(resp.Body).Decode(out)
	}
	return nil
}

// ExchangeGitHubToken sends a GitHub OAuth token to the web app and gets back an API token.
func (c *Client) ExchangeGitHubToken(githubToken string) (apiToken, username string, err error) {
	var result struct {
		Token    string `json:"token"`
		Username string `json:"username"`
	}
	err = c.do("POST", "/api/cli/auth", map[string]string{"github_token": githubToken}, &result)
	return result.Token, result.Username, err
}

type Post struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Slug      string `json:"slug"`
	Content   string `json:"content"`
	Public    bool   `json:"public"`
	CreatedAt string `json:"createdAt"`
}

func (c *Client) GetPost(id string) (*Post, error) {
	var post Post
	err := c.do("GET", "/api/posts/"+id, nil, &post)
	return &post, err
}

func (c *Client) ListPosts() ([]Post, error) {
	var posts []Post
	err := c.do("GET", "/api/posts", nil, &posts)
	return posts, err
}

func (c *Client) CreatePost(title, content string, public bool) (*Post, error) {
	var post Post
	err := c.do("POST", "/api/posts", map[string]any{
		"title":   title,
		"content": content,
		"public":  public,
	}, &post)
	return &post, err
}

func (c *Client) UpdatePost(id, title, slug, content string, public bool) (*Post, error) {
	var post Post
	err := c.do("PATCH", "/api/posts/"+id, map[string]any{
		"title":   title,
		"slug":    slug,
		"content": content,
		"public":  public,
	}, &post)
	return &post, err
}

func (c *Client) SuggestTopics(just bool, answers []string) ([]string, error) {
	var result struct {
		Suggestions []string `json:"suggestions"`
	}
	err := c.do("POST", "/api/suggest", map[string]any{
		"just":    just,
		"answers": answers,
	}, &result)
	return result.Suggestions, err
}
