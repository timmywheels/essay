package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"essay.sh/cli/internal/api"
	"essay.sh/cli/internal/config"
	ghflow "essay.sh/cli/internal/github"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	_ = cmd.Start()
}

func copyToClipboard(text string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("pbcopy")
	case "windows":
		cmd = exec.Command("clip")
	default:
		cmd = exec.Command("xclip", "-selection", "clipboard")
	}
	cmd.Stdin = strings.NewReader(text)
	_ = cmd.Run()
}

// GitHubClientID is set at build time via -ldflags, overridable by env var.
var GitHubClientID = ""

var authCmd = &cobra.Command{
	Use:   "auth",
	Short: "Authenticate with essay.sh",
	RunE: func(cmd *cobra.Command, args []string) error {
		clientID := GitHubClientID
		if env := os.Getenv("ESSAY_GITHUB_CLIENT_ID"); env != "" {
			clientID = env
		}
		if clientID == "" {
			return fmt.Errorf("ESSAY_GITHUB_CLIENT_ID not set")
		}

		dc, err := ghflow.RequestDeviceCode(clientID)
		if err != nil {
			return fmt.Errorf("failed to start auth: %w", err)
		}

		copyToClipboard(dc.UserCode)
		fmt.Printf("\nCode: %s (copied to clipboard)\n\nOpening browser in 2s...\n", dc.UserCode)
		time.Sleep(2 * time.Second)
		openBrowser(dc.VerificationURI)

		githubToken, err := ghflow.PollForToken(clientID, dc.DeviceCode, dc.Interval)
		if err != nil {
			return err
		}

		client := api.New()
		apiToken, username, err := client.ExchangeGitHubToken(githubToken)
		if err != nil {
			return fmt.Errorf("failed to exchange token: %w", err)
		}

		viper.Set(config.KeyToken, apiToken)
		viper.Set(config.KeyUsername, username)
		if err := config.Save(); err != nil {
			return fmt.Errorf("failed to save config: %w", err)
		}

		fmt.Printf("\nLogged in as %s\n", username)
		return nil
	},
}
