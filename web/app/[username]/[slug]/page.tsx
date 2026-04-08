import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { cache } from "react";
import { after } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ThemeToggle } from "@/components/theme-toggle";
import { EssayBadge } from "@/components/essay-badge";

export const revalidate = 60;

const getPostAndUser = cache(async function getPostAndUser(username: string, slug: string) {
  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, name: true, showUsername: true, profilePublic: true },
  });
  if (!user) return null;
  const post = await db.post.findFirst({ where: { userId: user.id, slug, published: true, public: true } });
  if (!post) return null;
  return { post, user };
});

export async function generateMetadata({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params;
  const result = await getPostAndUser(username, slug);
  if (!result) return {};
  const { post, user } = result;
  const author = user.name || (user.showUsername ? username : undefined);
  const excerpt = post.content.replace(/\s+/g, " ").trim().slice(0, 160);
  return {
    title: post.title,
    description: excerpt,
    openGraph: {
      title: post.title,
      description: excerpt,
      type: "article",
      ...(author && { authors: [author] }),
    },
    twitter: { card: "summary", title: post.title, description: excerpt },
  };
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const years = Math.floor(seconds / 31536000);
  const months = Math.floor(seconds / 2592000);
  const days = Math.floor(seconds / 86400);
  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (days > 0) return `${days}d ago`;
  return "today";
}

export default async function PostPage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params;
  const [result, session] = await Promise.all([getPostAndUser(username, slug), auth()]);
  if (!result) notFound();
  const { post, user } = result;
  if (!user.profilePublic && session?.user?.id !== user.id) notFound();

  after(() => db.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } }));

  const host = (await headers()).get("host") ?? "";
  const isCustomDomain = host !== "essay.sh" && host !== "www.essay.sh" && !host.endsWith(".vercel.app") && !host.startsWith("localhost");

  return (
    <>
    <ThemeToggle />
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold leading-snug">{post.title}</h1>
        <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
          <div className="flex items-center gap-2">
            {user.profilePublic && (
              <Link href={isCustomDomain ? "/" : `/${username}`} className="hover:underline underline-offset-2">
                {user.name || (user.showUsername ? username : "←")}
              </Link>
            )}
            {post.publishedAt && (
              <>
                {user.profilePublic && <span>·</span>}
                <span>
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </span>
                <span style={{ opacity: 0.5 }}>({timeAgo(new Date(post.publishedAt))})</span>
              </>
            )}
          </div>
          <span>{post.views.toLocaleString()} views</span>
        </div>
      </header>

      <article className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
        {post.content}
      </article>
    </main>
    <EssayBadge username={username} />
    </>
  );
}
