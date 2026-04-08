# essay CLI

Publish to [essay.sh](https://essay.sh) from your terminal.

## install

```sh
curl -fsSL essay.sh/install | sh
```

Or download a binary from [releases](https://github.com/timmywheels/essay/releases/latest).

## commands

```
essay auth               authenticate with essay.sh
essay new [title]        create a new post
essay list               list your posts
essay edit <slug>        edit a post in $EDITOR
essay publish <slug>     toggle public / private
```

### auth

Starts GitHub device flow. Opens your browser automatically and copies the confirmation code to your clipboard.

```sh
essay auth
```

### new

Creates a post and opens it in `$EDITOR`. Falls back to `vi` if `$EDITOR` not set.

```sh
essay new                            # auto-generated slug
essay new "On distributed systems"   # sets the title
```

Saving and quitting the editor saves the post. Use `essay publish <slug>` to make it public.

### list

```sh
essay list
```

```
┌──────────────────────┬────────────────────────┬────────────┐
│ SLUG                 │ TITLE                  │ VISIBILITY │
├──────────────────────┼────────────────────────┼────────────┤
│ on-dist-systems      │ On distributed systems │ public     │
│ rough-draft          │ Rough draft            │ private    │
└──────────────────────┴────────────────────────┴────────────┘
```

### edit

Fetches a post and opens it in `$EDITOR`. Accepts slug, full ID, or ID prefix.

```sh
essay edit on-distributed-systems
essay edit abc123ef
```

Saving with no changes is a no-op.

### publish

Toggles a post between public and private.

```sh
essay publish on-distributed-systems
# → on-distributed-systems is now private

essay publish on-distributed-systems
# → on-distributed-systems is now public
```

## vim mode

In the web editor, vim keybindings can be toggled via the `···` menu. In the CLI, just set `$EDITOR`:

```sh
export EDITOR=vim
essay edit my-post
```

Vim ex commands are wired up in the web editor:

| command | action |
|---|---|
| `:w` | save draft |
| `:wq` | save and return to profile |

## configuration

Config is stored at `~/.config/essay/config.toml` after `essay auth`.

```toml
token    = "..."   # API token
username = "..."   # your essay.sh username
```

### environment variables

| variable | description |
|---|---|
| `ESSAY_API` | Override API endpoint (default: `https://essay.sh`) |
| `ESSAY_GITHUB_CLIENT_ID` | Override GitHub App client ID (default: baked in at build time) |
| `EDITOR` | Editor to open for `new` and `edit` (default: `vi`) |

## development

```sh
git clone https://github.com/timmywheels/essay
cd essay/cli

export ESSAY_GITHUB_CLIENT_ID="<your-dev-app-client-id>"
export ESSAY_API="http://localhost:3000"

make install   # builds to $GOPATH/bin/essay
essay auth
```

### make targets

| target | description |
|---|---|
| `make build` | build binary to `./essay` |
| `make install` | build and install to `$GOPATH/bin` |
| `make release` | run goreleaser locally (requires `GITHUB_TOKEN`) |
| `make setup` | register `ESSAY_GITHUB_CLIENT_ID` as a GitHub Actions secret |

## structure

```
cli/
├── cmd/
│   ├── auth.go       # GitHub device flow + browser/clipboard automation
│   ├── new.go        # create post, open $EDITOR
│   ├── list.go       # list posts (lipgloss table)
│   ├── edit.go       # fetch + edit post in $EDITOR
│   ├── publish.go    # toggle public/private
│   └── root.go       # cobra root, command registration
├── internal/
│   ├── api/          # HTTP client (bearer token auth)
│   ├── config/       # viper config (~/.config/essay/config.toml)
│   └── github/       # device flow auth
├── main.go
├── Makefile
└── .goreleaser.yml
```
