package cmd

import (
	"fmt"
	"os"
	"os/exec"

	"essay.sh/cli/internal/api"
	"essay.sh/cli/internal/config"
	"github.com/spf13/cobra"
)

var newCmd = &cobra.Command{
	Use:   "new [title]",
	Short: "Create a new post",
	Args:  cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		if config.Token() == "" {
			return fmt.Errorf("not logged in — run: essay auth")
		}

		title := ""
		if len(args) > 0 {
			title = args[0]
		}

		// Open $EDITOR for content
		content, err := openEditor("")
		if err != nil {
			return err
		}
		if content == "" {
			fmt.Println("Empty post, nothing saved.")
			return nil
		}

		client := api.New()
		post, err := client.CreatePost(title, content, true)
		if err != nil {
			return err
		}

		fmt.Printf("Published: %s/%s/%s\n", config.APIBase(), config.Username(), post.Slug)
		return nil
	},
}

func openEditor(initial string) (string, error) {
	editor := os.Getenv("EDITOR")
	if editor == "" {
		editor = "vi"
	}

	f, err := os.CreateTemp("", "essay-*.md")
	if err != nil {
		return "", err
	}
	defer os.Remove(f.Name())

	if initial != "" {
		f.WriteString(initial)
	}
	f.Close()

	c := exec.Command(editor, f.Name())
	c.Stdin = os.Stdin
	c.Stdout = os.Stdout
	c.Stderr = os.Stderr
	if err := c.Run(); err != nil {
		return "", err
	}

	b, err := os.ReadFile(f.Name())
	if err != nil {
		return "", err
	}
	return string(b), nil
}
