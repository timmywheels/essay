package cmd

import (
	"fmt"

	"essay.sh/cli/internal/api"
	"essay.sh/cli/internal/config"
	"github.com/spf13/cobra"
)

var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List your posts",
	RunE: func(cmd *cobra.Command, args []string) error {
		if config.Token() == "" {
			return fmt.Errorf("not logged in — run: essay auth")
		}

		client := api.New()
		posts, err := client.ListPosts()
		if err != nil {
			return err
		}

		if len(posts) == 0 {
			fmt.Println("No posts yet. Run: essay new")
			return nil
		}

		for _, p := range posts {
			vis := "public"
			if !p.Public {
				vis = "private"
			}
			fmt.Printf("  %s  %-40s  %s\n", p.ID[:8], p.Title, vis)
		}
		return nil
	},
}
