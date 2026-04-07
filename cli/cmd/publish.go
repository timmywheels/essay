package cmd

import (
	"fmt"

	"essay.sh/cli/internal/api"
	"essay.sh/cli/internal/config"
	"github.com/spf13/cobra"
)

var publishCmd = &cobra.Command{
	Use:   "publish <post-id>",
	Short: "Toggle a post public/private",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		if config.Token() == "" {
			return fmt.Errorf("not logged in — run: essay auth")
		}

		id := args[0]
		client := api.New()

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

		newPublic := !target.Public
		_, err = client.UpdatePost(target.ID, target.Title, target.Slug, "", newPublic)
		if err != nil {
			return err
		}

		state := "public"
		if !newPublic {
			state = "private"
		}
		fmt.Printf("%s is now %s\n", target.Slug, state)
		return nil
	},
}
