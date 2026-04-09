-- RenameForeignKey
ALTER TABLE "accounts" RENAME CONSTRAINT "accounts_userId_fkey" TO "accounts_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "posts" RENAME CONSTRAINT "posts_userId_fkey" TO "posts_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "sessions" RENAME CONSTRAINT "sessions_userId_fkey" TO "sessions_user_id_fkey";
