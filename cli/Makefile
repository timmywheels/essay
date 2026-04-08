BIN    := essay
GOBIN  := $(shell go env GOPATH)/bin
# Set ESSAY_GITHUB_CLIENT_ID in your shell to your dev GitHub App client ID.
# The prod client ID is stored as a GitHub Actions secret and injected at release time.
LDFLAGS := -X essay.sh/cli/cmd.GitHubClientID=$(ESSAY_GITHUB_CLIENT_ID)

.PHONY: build install release setup

build:
	go build -ldflags "$(LDFLAGS)" -o $(BIN) .

install:
	go build -ldflags "$(LDFLAGS)" -o $(GOBIN)/$(BIN) .

release:
	goreleaser release --clean

setup:
	gh secret set ESSAY_GITHUB_CLIENT_ID --body "$(ESSAY_GITHUB_CLIENT_ID)"
