-- CreateTable
CREATE TABLE "slug_redirects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "old_slug" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slug_redirects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slug_redirects_user_id_old_slug_key" ON "slug_redirects"("user_id", "old_slug");

-- CreateIndex
CREATE INDEX "slug_redirects_post_id_idx" ON "slug_redirects"("post_id");

-- AddForeignKey
ALTER TABLE "slug_redirects" ADD CONSTRAINT "slug_redirects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slug_redirects" ADD CONSTRAINT "slug_redirects_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
