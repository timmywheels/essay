import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { resolveUser } from "@/lib/cli-auth";
import { getInstallationOctokit, buildMarkdown, writePostToGitHub } from "@/lib/github";
import { uniqueNamesGenerator, adjectives, animals } from "unique-names-generator";

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const createSchema = z.object({
  title: z.string(),
  content: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Invalid slug").optional(),
  published: z.boolean().optional(),
  public: z.boolean().optional(),
});

export async function GET(req: Request) {
  const resolved = await resolveUser(req);
  if (!resolved) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const posts = await db.post.findMany({
    where: { userId: resolved.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true, public: true, published: true, createdAt: true },
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const resolved = await resolveUser(req);
  if (!resolved) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { user, userId } = resolved;
  if (!user.username) return NextResponse.json({ error: "No username set." }, { status: 400 });
  if (!user.githubInstallationId || !user.githubRepo || !user.githubUsername) {
    return NextResponse.json({ error: "GitHub repo not connected." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { title, content, slug: rawSlug, published, public: isPublic } = parsed.data;

  const slug = rawSlug || uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "-",
    length: 2,
  });

  const conflict = await db.post.findUnique({
    where: { userId_slug: { userId, slug } },
  });
  if (conflict) return NextResponse.json({ error: "Slug already in use." }, { status: 409 });

  const publishedAt = published ? new Date() : null;

  const octokit = await getInstallationOctokit(user.githubInstallationId);
  const markdown = buildMarkdown({ title, content, slug, published: !!published, public: isPublic !== false, publishedAt });
  await writePostToGitHub(octokit, user.githubUsername, user.githubRepo, slug, markdown, title);

  const post = await db.post.create({
    data: {
      title, content, slug,
      published: !!published,
      public: isPublic !== false,
      publishedAt,
      wordCount: countWords(content),
      userId,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
