package cmd

import (
	"fmt"

	"essay.sh/cli/internal/api"
	"essay.sh/cli/internal/config"
	"github.com/spf13/cobra"
)

var editCmd = &cobra.Command{
	Use:   "edit <post-id>",
	Short: "Edit an existing post",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		if config.Token() == "" {
			return fmt.Errorf("not logged in — run: essay auth")
		}

		id := args[0]
		client := api.New()

		// Find post by slug, ID prefix, or full ID
		posts, err := client.ListPosts()
		if err != nil {
			return err
		}

		var target *api.Post
		for i, p := range posts {
			if p.ID == id || p.Slug == id || (len(p.ID) >= 8 && p.ID[:8] == id) {
				target = &posts[i]
				break
			}
		}
		if target == nil {
			return fmt.Errorf("post not found: %s", id)
		}

		// Fetch full post content
		full, err := client.GetPost(target.ID)
		if err != nil {
			return err
		}

		content, err := openEditor(full.Content)
		if err != nil {
			return err
		}
		if content == full.Content {
			fmt.Println("No changes.")
			return nil
		}

		_, err = client.UpdatePost(full.ID, full.Title, full.Slug, content, full.Public)
		if err != nil {
			return err
		}

		fmt.Printf("Updated: %s/%s/%s\n", config.APIBase(), config.Username(), target.Slug)
		return nil
	},
}
