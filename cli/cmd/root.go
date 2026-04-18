package cmd

import (
	"fmt"
	"os"

	"essay.sh/cli/internal/config"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "essay",
	Short: "essay.sh — publish from your terminal",
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		config.Init()
	},
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func init() {
	rootCmd.AddCommand(authCmd)
	rootCmd.AddCommand(newCmd)
	rootCmd.AddCommand(listCmd)
	rootCmd.AddCommand(publishCmd)
	rootCmd.AddCommand(editCmd)
	rootCmd.AddCommand(suggestCmd)
}
