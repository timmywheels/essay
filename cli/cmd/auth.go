package cmd

import (
	"fmt"
	"os"

	"essay.sh/cli/internal/api"
	"essay.sh/cli/internal/config"
	ghflow "essay.sh/cli/internal/github"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// GitHubClientID is set at build time via -ldflags, overridable by env var.
var GitHubClientID = ""

var authCmd = &cobra.Command{
	Use:   "auth",
	Short: "Authenticate with essay.sh",
	RunE: func(cmd *cobra.Command, args []string) error {
		clientID := os.Getenv("ESSAY_GITHUB_CLIENT_ID")
		if clientID == "" {
			clientID = GitHubClientID
		}
		if clientID == "" {
			return fmt.Errorf("ESSAY_GITHUB_CLIENT_ID not set")
		}

		dc, err := ghflow.RequestDeviceCode(clientID)
		if err != nil {
			return fmt.Errorf("failed to start auth: %w", err)
		}

		fmt.Printf("\nOpen this URL in your browser:\n\n  %s\n\nEnter code: %s\n\nWaiting...\n", dc.VerificationURI, dc.UserCode)

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
