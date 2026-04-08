package config

import (
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

const (
	KeyToken    = "token"
	KeyUsername = "username"
)

func Init() {
	dir, err := os.UserConfigDir()
	if err != nil {
		dir = os.Getenv("HOME")
	}
	cfgDir := filepath.Join(dir, "essay")
	os.MkdirAll(cfgDir, 0700)

	viper.SetConfigName("config")
	viper.SetConfigType("toml")
	viper.AddConfigPath(cfgDir)

	_ = viper.ReadInConfig()
}

func Save() error {
	dir, err := os.UserConfigDir()
	if err != nil {
		dir = os.Getenv("HOME")
	}
	cfgPath := filepath.Join(dir, "essay", "config.toml")
	return viper.WriteConfigAs(cfgPath)
}

func Token() string    { return viper.GetString(KeyToken) }
func Username() string { return viper.GetString(KeyUsername) }

func APIBase() string {
	if v := os.Getenv("ESSAY_API"); v != "" {
		return v
	}
	return "https://essay.sh"
}
