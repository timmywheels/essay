import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { resolveUser } from "@/lib/cli-auth";
import { getInstallationOctokit, buildMarkdown, writePostToGitHub, deletePostFromGitHub, renamePostOnGitHub, getPostContent } from "@/lib/github";

const patchSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Invalid slug").optional(),
  published: z.boolean().optional(),
  public: z.boolean().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resolved = await resolveUser(req);
  if (!resolved) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await db.post.findUnique({ where: { id } });
  if (!post || post.userId !== resolved.userId) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Fetch content from GitHub
  const { user } = resolved;
  let content: string | null = null;
  if (user.githubInstallationId && user.githubRepo && user.githubUsername) {
    const octokit = await getInstallationOctokit(user.githubInstallationId);
    content = await getPostContent(octokit, user.githubUsername, user.githubRepo, post.slug);
  }

  return NextResponse.json({ ...post, content });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resolved = await resolveUser(req);
  if (!resolved) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { user, userId } = resolved;

  const post = await db.post.findUnique({ where: { id } });
  if (!post || post.userId !== userId) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!user.username) return NextResponse.json({ error: "No username set." }, { status: 400 });
  if (!user.githubInstallationId || !user.githubRepo || !user.githubUsername) {
    return NextResponse.json({ error: "GitHub repo not connected." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const title = parsed.data.title ?? post.title;
  const slug = parsed.data.slug ?? post.slug;
  const published = parsed.data.published ?? post.published;
  const isPublic = parsed.data.public ?? post.public;

  if (slug !== post.slug) {
    const conflict = await db.post.findUnique({ where: { userId_slug: { userId, slug } } });
    if (conflict) return NextResponse.json({ error: "Slug already in use." }, { status: 409 });
  }

  const publishedAt = published && !post.publishedAt ? new Date() : post.publishedAt;
  const octokit = await getInstallationOctokit(user.githubInstallationId);

  // Fetch current content from GitHub to preserve it if not updating
  let content = parsed.data.content ?? null;
  if (!content) {
    content = await getPostContent(octokit, user.githubUsername, user.githubRepo, post.slug) ?? "";
  }

  const slugChanged = slug !== post.slug;

  const markdown = buildMarkdown({ title, content, slug, published: !!published, public: !!isPublic, publishedAt });
  if (slugChanged) {
    // Atomic rename: delete old path and add new path in a single commit so
    // git's rename detection preserves history across the slug change.
    await renamePostOnGitHub(octokit, user.githubUsername, user.githubRepo, post.slug, slug, markdown, title);
  } else {
    await writePostToGitHub(octokit, user.githubUsername, user.githubRepo, slug, markdown, title);
  }

  const updated = await db.$transaction(async (tx) => {
    const result = await tx.post.update({
      where: { id },
      data: { title, slug, published: !!published, public: !!isPublic, publishedAt },
    });
    if (slugChanged) {
      // Clear any stale redirect pointing at the new slug; then record the rename.
      await tx.slugRedirect.deleteMany({ where: { userId, oldSlug: slug } });
      await tx.slugRedirect.upsert({
        where: { userId_oldSlug: { userId, oldSlug: post.slug } },
        create: { userId, oldSlug: post.slug, postId: post.id },
        update: { postId: post.id, createdAt: new Date() },
      });
    }
    return result;
  });

  revalidatePath(`/${user.username}/${slug}`);
  revalidatePath(`/${user.username}`);
  if (slugChanged) revalidatePath(`/${user.username}/${post.slug}`);

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resolved = await resolveUser(req);
  if (!resolved) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { user, userId } = resolved;
  const post = await db.post.findUnique({ where: { id } });
  if (!post || post.userId !== userId) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (user.githubInstallationId && user.githubRepo && user.githubUsername) {
    const octokit = await getInstallationOctokit(user.githubInstallationId);
    await deletePostFromGitHub(octokit, user.githubUsername, user.githubRepo, post.slug);
  }

  await db.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
