# essay.sh

**Commit your thoughts to source.**

A git-native publishing platform for developers. Every post is a markdown file in your own GitHub repo — no lock-in, no export button, no middleman. Write from the browser, vim, vscode, or anywhere that speaks markdown.

→ [essay.sh](https://essay.sh)

---

## install

```sh
curl -fsSL essay.sh/install | sh
```

Or download a binary directly from [releases](https://github.com/timmywheels/essay/releases/latest). Supports macOS, Linux, and Windows (amd64 + arm64).

---

## quickstart

```sh
essay auth                                  # opens browser, copies code to clipboard
essay new "On the nature of side projects"  # opens $EDITOR
essay publish on-the-nature-of-side-projects
```

Your post is now live at `essay.sh/username/on-the-nature-of-side-projects`.

---

## how it works

1. Sign in at [essay.sh](https://essay.sh) with GitHub
2. Connect a GitHub repo — the app only ever accesses that one repo
3. Run `essay auth` to authenticate the CLI
4. Write from the web editor or the CLI — both commit markdown to your repo
5. Posts are served at `essay.sh/username/slug`

Every post is stored as `posts/{slug}.md` with YAML frontmatter in your repo. You own it forever.

---

## cli commands

### `essay auth`

Authenticate with your essay.sh account via GitHub device flow. The confirmation code is copied to your clipboard and the browser opens automatically.

### `essay new [title]`

Create a new post. Opens `$EDITOR` with a blank file. If no title is given, a random slug is generated.

```sh
essay new
essay new "Thoughts on Postgres"
```

### `essay list`

List all your posts.

```
SLUG                  TITLE                    VISIBILITY
thoughts-on-postgres  Thoughts on Postgres     public
rough-draft           Rough draft              private
```

### `essay edit <slug>`

Fetch a post and open it in `$EDITOR`. Accepts slug, full ID, or ID prefix.

```sh
essay edit thoughts-on-postgres
essay edit abc123
```

### `essay publish <slug>`

Toggle a post between public and private.

```sh
essay publish thoughts-on-postgres
```

---

## web editor

The editor at `essay.sh/dashboard/new` supports:

- Markdown editing with live preview
- Vim keybindings — toggle via `···` menu (top right)
- Public / private visibility toggle
- Custom or auto-generated slugs
- `⌘S` to save, `⌘↵` to publish
- `:w` and `:wq` in vim mode

---

## stack

| layer | tech |
|---|---|
| web | Next.js 16 (App Router, ISR) |
| auth | Auth.js v5 + GitHub OAuth + CLI bearer tokens |
| database | Prisma 7 + PostgreSQL (Neon) |
| post storage | GitHub (via App installation tokens) |
| cli | Go 1.23 + Cobra + Viper |
| terminal ui | Charmbracelet lipgloss |
| hosting | Vercel |
| cli releases | goreleaser + release-please |

---

## development

**Prerequisites:** Node 20+, pnpm, Go 1.23+, Docker

```sh
git clone https://github.com/timmywheels/essay
cd essay

# web
cd web
cp .env.local.example .env.local  # fill in values below
docker compose up -d              # start postgres
pnpm install
npx prisma migrate deploy
pnpm dev                          # http://localhost:3000

# cli (separate terminal)
cd cli
export ESSAY_GITHUB_CLIENT_ID="<your-dev-app-client-id>"
export ESSAY_API="http://localhost:3000"
make install   # installs to $GOPATH/bin
essay auth
```

### environment variables

| variable | description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_GITHUB_ID` | GitHub App OAuth client ID |
| `AUTH_GITHUB_SECRET` | GitHub App OAuth client secret |
| `GITHUB_APP_ID` | GitHub App numeric ID |
| `GITHUB_APP_NAME` | GitHub App slug |
| `GITHUB_APP_PRIVATE_KEY` | PEM private key (`\n` for newlines) |

You'll need a [GitHub App](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps) with read/write access to repository contents.

---

## project structure

```
essay/
├── cli/                    # Go CLI
│   ├── cmd/                # auth, new, list, edit, publish
│   ├── internal/
│   │   ├── api/            # HTTP client to web backend
│   │   ├── config/         # ~/.config/essay/config.toml
│   │   └── github/         # device flow auth
│   ├── Makefile
│   └── .goreleaser.yml
│
├── web/                    # Next.js app
│   ├── app/
│   │   ├── api/            # posts CRUD, CLI auth, GitHub webhooks
│   │   ├── [username]/     # public profile + post pages
│   │   └── dashboard/      # editor
│   ├── components/
│   ├── lib/                # db, github, auth helpers
│   └── prisma/
│
└── .github/workflows/
    ├── release.yml         # goreleaser on v* tag → CLI binaries
    └── release-please.yml  # opens release PRs from conventional commits
```

---

## releases

CLI releases are fully automated:

1. Commit to `main` using [conventional commits](https://www.conventionalcommits.org) — `feat:`, `fix:`, `chore:`, etc.
2. release-please opens a versioned PR with a generated changelog
3. Merge the PR → tag created → goreleaser builds + publishes binaries for all platforms

Web deploys automatically on every push to `main` via Vercel.

---

## contributing

PRs welcome. For significant changes, open an issue first.

```sh
# run tests
cd cli && go test ./...
cd web && pnpm test
```

---

## license

MIT
