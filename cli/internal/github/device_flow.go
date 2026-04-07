package github

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const deviceCodeURL = "https://github.com/login/device/code"
const tokenURL = "https://github.com/login/oauth/access_token"

type DeviceCodeResponse struct {
	DeviceCode      string `json:"device_code"`
	UserCode        string `json:"user_code"`
	VerificationURI string `json:"verification_uri"`
	ExpiresIn       int    `json:"expires_in"`
	Interval        int    `json:"interval"`
}

type tokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	Scope       string `json:"scope"`
	Error       string `json:"error"`
}

func RequestDeviceCode(clientID string) (*DeviceCodeResponse, error) {
	body, _ := json.Marshal(map[string]string{"client_id": clientID})
	req, _ := http.NewRequest("POST", deviceCodeURL, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var dc DeviceCodeResponse
	if err := json.NewDecoder(resp.Body).Decode(&dc); err != nil {
		return nil, err
	}
	return &dc, nil
}

func PollForToken(clientID, deviceCode string, interval int) (string, error) {
	wait := time.Duration(interval) * time.Second
	body := map[string]string{
		"client_id":   clientID,
		"device_code": deviceCode,
		"grant_type":  "urn:ietf:params:oauth:grant-type:device_code",
	}

	for {
		time.Sleep(wait)

		b, _ := json.Marshal(body)
		req, _ := http.NewRequest("POST", tokenURL, bytes.NewReader(b))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return "", err
		}
		defer resp.Body.Close()

		var tr tokenResponse
		if err := json.NewDecoder(resp.Body).Decode(&tr); err != nil {
			return "", err
		}

		switch tr.Error {
		case "":
			return tr.AccessToken, nil
		case "authorization_pending":
			// keep polling
		case "slow_down":
			wait += 5 * time.Second
		case "expired_token":
			return "", fmt.Errorf("device code expired, please try again")
		case "access_denied":
			return "", fmt.Errorf("access denied")
		default:
			return "", fmt.Errorf("unexpected error: %s", tr.Error)
		}
	}
}
