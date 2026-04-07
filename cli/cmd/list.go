package cmd

import (
	"fmt"

	"essay.sh/cli/internal/api"
	"essay.sh/cli/internal/config"
	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/lipgloss/table"
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

		headerStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("241"))
		cellStyle := lipgloss.NewStyle().Padding(0, 1)
		dimStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("241")).Padding(0, 1)

		rows := make([][]string, len(posts))
		for i, p := range posts {
			vis := "public"
			if !p.Public {
				vis = "private"
			}
			rows[i] = []string{p.Slug, p.Title, vis}
		}

		t := table.New().
			Border(lipgloss.NormalBorder()).
			BorderStyle(lipgloss.NewStyle().Foreground(lipgloss.Color("238"))).
			StyleFunc(func(row, col int) lipgloss.Style {
				if row == table.HeaderRow {
					return headerStyle.Padding(0, 1)
				}
				if col == 2 {
					return dimStyle
				}
				return cellStyle
			}).
			Headers("SLUG", "TITLE", "VISIBILITY").
			Rows(rows...)

		fmt.Println(t)
		return nil
	},
}
