-- ============================================================
-- Step 1: Rename camelCase columns to snake_case in `users`
-- ============================================================
ALTER TABLE "users" RENAME COLUMN "emailVerified" TO "email_verified";
ALTER TABLE "users" RENAME COLUMN "githubUsername" TO "github_username";
ALTER TABLE "users" RENAME COLUMN "githubInstallationId" TO "github_installation_id";
ALTER TABLE "users" RENAME COLUMN "githubRepo" TO "github_repo";
ALTER TABLE "users" RENAME COLUMN "cliToken" TO "cli_token";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";

ALTER INDEX IF EXISTS "users_githubUsername_key" RENAME TO "users_github_username_key";
ALTER INDEX IF EXISTS "users_cliToken_key" RENAME TO "users_cli_token_key";

-- ============================================================
-- Step 2: Rename camelCase columns to snake_case in `accounts`
-- ============================================================
ALTER TABLE "accounts" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "accounts" RENAME COLUMN "providerAccountId" TO "provider_account_id";

ALTER INDEX IF EXISTS "accounts_provider_providerAccountId_key" RENAME TO "accounts_provider_provider_account_id_key";

-- ============================================================
-- Step 3: Rename camelCase columns to snake_case in `sessions`
-- ============================================================
ALTER TABLE "sessions" RENAME COLUMN "sessionToken" TO "session_token";
ALTER TABLE "sessions" RENAME COLUMN "userId" TO "user_id";

ALTER INDEX IF EXISTS "sessions_sessionToken_key" RENAME TO "sessions_session_token_key";

-- ============================================================
-- Step 4: Rename camelCase columns to snake_case in `posts`
-- ============================================================
ALTER TABLE "posts" RENAME COLUMN "publishedAt" TO "published_at";
ALTER TABLE "posts" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "posts" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "posts" RENAME COLUMN "userId" TO "user_id";

ALTER INDEX IF EXISTS "posts_userId_slug_key" RENAME TO "posts_user_id_slug_key";

-- ============================================================
-- Step 5: Create `user_settings` table
-- ============================================================
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bio" TEXT,
    "profile_public" BOOLEAN NOT NULL DEFAULT true,
    "show_username" BOOLEAN NOT NULL DEFAULT true,
    "show_activity_graph" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "links" JSONB,
    "custom_domain" TEXT,
    "domain_verified_at" TIMESTAMP(3),

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");
CREATE UNIQUE INDEX "user_settings_custom_domain_key" ON "user_settings"("custom_domain");
CREATE INDEX "user_settings_custom_domain_idx" ON "user_settings"("custom_domain");

ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- Step 6: Migrate settings data from `users` into `user_settings`
-- ============================================================
INSERT INTO "user_settings" (
    "id",
    "user_id",
    "bio",
    "profile_public",
    "show_username",
    "show_activity_graph",
    "theme",
    "links",
    "custom_domain",
    "domain_verified_at"
)
SELECT
    gen_random_uuid()::TEXT,
    id,
    bio,
    "profilePublic",
    "showUsername",
    "showActivityGraph",
    theme,
    links,
    "customDomain",
    "domainVerifiedAt"
FROM "users";

-- ============================================================
-- Step 7: Drop settings columns from `users`
-- ============================================================
ALTER TABLE "users"
    DROP COLUMN "bio",
    DROP COLUMN "profilePublic",
    DROP COLUMN "showUsername",
    DROP COLUMN "showActivityGraph",
    DROP COLUMN "theme",
    DROP COLUMN "links",
    DROP COLUMN "customDomain",
    DROP COLUMN "domainVerifiedAt";

-- Drop now-redundant indexes that referenced the dropped columns
DROP INDEX IF EXISTS "users_customDomain_key";
DROP INDEX IF EXISTS "users_customDomain_idx";
DROP INDEX IF EXISTS "users_custom_domain_key";
DROP INDEX IF EXISTS "users_custom_domain_idx";
