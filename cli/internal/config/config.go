package config

import (
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

const (
	KeyToken    = "token"
	KeyUsername = "username"
	KeyAPIBase  = "api_base"
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

	base := "https://essay.sh"
	if v := os.Getenv("ESSAY_API"); v != "" {
		base = v
	}
	viper.SetDefault(KeyAPIBase, base)

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
func APIBase() string  { return viper.GetString(KeyAPIBase) }
