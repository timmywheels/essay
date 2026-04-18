package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"essay.sh/cli/internal/api"
	"essay.sh/cli/internal/config"
	"github.com/charmbracelet/lipgloss"
	"github.com/spf13/cobra"
)

var quickFlag bool

var suggestCmd = &cobra.Command{
	Use:   "suggest",
	Short: "Generate topic ideas for your next post",
	RunE: func(cmd *cobra.Command, args []string) error {
		if config.Token() == "" {
			return fmt.Errorf("not logged in — run: essay auth")
		}

		dim := lipgloss.NewStyle().Foreground(lipgloss.Color("241"))
		bold := lipgloss.NewStyle().Bold(true)
		num := lipgloss.NewStyle().Foreground(lipgloss.Color("241")).Bold(true)

		answers := []string{}

		if !quickFlag {
			questions := []string{
				"What topics or ideas have you been thinking about lately?",
				"Who is your primary audience?",
			}

			fmt.Println()
			fmt.Println(bold.Render("A couple of quick questions:"))
			fmt.Println()

			reader := bufio.NewReader(os.Stdin)
			for _, q := range questions {
				fmt.Println(dim.Render(q))
				fmt.Print("  > ")
				answer, _ := reader.ReadString('\n')
				answers = append(answers, strings.TrimSpace(answer))
				fmt.Println()
			}
		}

		fmt.Println(dim.Render("Generating topic ideas..."))

		client := api.New()
		suggestions, err := client.SuggestTopics(quickFlag, answers)
		if err != nil {
			return err
		}

		fmt.Println()
		fmt.Println(bold.Render("Topics for your next post:"))
		fmt.Println()
		for i, s := range suggestions {
			fmt.Printf("  %s  %s\n", num.Render(fmt.Sprintf("%d.", i+1)), s)
		}
		fmt.Println()
		fmt.Println(dim.Render("Run `essay new` to start writing."))
		fmt.Println()

		return nil
	},
}

func init() {
	suggestCmd.Flags().BoolVar(&quickFlag, "quick", false, "Skip questions and generate from existing posts")
}
