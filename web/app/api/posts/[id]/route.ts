import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { resolveUser } from "@/lib/cli-auth";
import { getInstallationOctokit, buildMarkdown, writePostToGitHub, deletePostFromGitHub } from "@/lib/github";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resolved = await resolveUser(req);
  if (!resolved) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await db.post.findUnique({ where: { id } });
  if (!post || post.userId !== resolved.userId) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json(post);
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

  const body = await req.json();
  const title = body.title ?? post.title;
  const content = body.content || post.content;
  const slug = body.slug ?? post.slug;
  const published = body.published ?? post.published;
  const isPublic = body.public ?? post.public;

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ error: "Invalid slug." }, { status: 400 });

  if (slug !== post.slug) {
    const conflict = await db.post.findUnique({ where: { userId_slug: { userId, slug } } });
    if (conflict) return NextResponse.json({ error: "Slug already in use." }, { status: 409 });
  }

  const publishedAt = published && !post.publishedAt ? new Date() : post.publishedAt;
  const octokit = await getInstallationOctokit(user.githubInstallationId);

  if (slug !== post.slug) {
    await deletePostFromGitHub(octokit, user.githubUsername, user.githubRepo, post.slug);
  }

  const markdown = buildMarkdown({ title, content, slug, published: !!published, public: !!isPublic, publishedAt });
  await writePostToGitHub(octokit, user.githubUsername, user.githubRepo, slug, markdown, title);

  const updated = await db.post.update({
    where: { id },
    data: { title, content, slug, published: !!published, public: !!isPublic, publishedAt },
  });

  revalidatePath(`/${user.username}/${slug}`);
  revalidatePath(`/${user.username}`);

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
