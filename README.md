# essay.sh

**Commit your thoughts to source.**

A minimalist publishing platform for developers. Every post is a markdown file in your own GitHub repo — no lock-in, no middleman. Write from the browser, vim, vscode, or anywhere that speaks markdown.

→ [essay.sh](https://essay.sh)

---

## install

```sh
curl -fsSL essay.sh/install | sh
```

Or download a binary directly from [releases](https://github.com/timmywheels/essay/releases/latest).

---

## usage

```sh
# authenticate with your essay.sh account
essay auth

# create a new post (opens $EDITOR)
essay new "my post title"

# list your posts
essay list

# edit a post by slug
essay edit my-post-title

# toggle public/private
essay publish my-post-title
```

---

## how it works

1. **sign in** at [essay.sh](https://essay.sh) with GitHub
2. **connect** a GitHub repo — your posts live there as markdown files
3. **write** from the web editor or the CLI
4. **publish** — posts are served at `essay.sh/username/post-slug`

Every post is stored as a `.md` file with frontmatter in your repo. You own it forever.

---

## stack

| layer | tech |
|---|---|
| web | Next.js 16 (App Router, ISR) |
| auth | Auth.js v5 + GitHub App |
| db | Prisma 7 + Neon (Postgres) |
| storage | GitHub (via installation tokens) |
| cli | Go + Cobra |
| deploy | Vercel |

---

## development

**prerequisites:** Node 20+, Go 1.23+, Docker

```sh
git clone https://github.com/timmywheels/essay
cd essay

# start postgres
cd web && docker compose up -d

# install deps + migrate
pnpm install
npx prisma db push

# run web
pnpm dev

# build cli
cd ../cli && make build
./essay --help
```

Copy `web/.env.local.example` to `web/.env.local` and fill in:

```sh
DATABASE_URL=          # postgres connection string
AUTH_SECRET=           # openssl rand -base64 32
AUTH_GITHUB_ID=        # github app client id
AUTH_GITHUB_SECRET=    # github app client secret
GITHUB_APP_ID=         # github app id (numeric)
GITHUB_APP_NAME=       # github app slug
GITHUB_APP_PRIVATE_KEY= # pem key, \n for newlines
```

---

## license

MIT
