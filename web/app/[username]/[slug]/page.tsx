import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ThemeToggle } from "@/components/theme-toggle";

export const revalidate = 60;

async function getPost(username: string, slug: string) {
  const user = await db.user.findUnique({ where: { username } });
  if (!user) return null;
  return db.post.findFirst({ where: { userId: user.id, slug, published: true, public: true } });
}

export async function generateMetadata({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params;
  const post = await getPost(username, slug);
  if (!post) return {};
  return { title: post.title };
}

export default async function PostPage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params;
  const post = await getPost(username, slug);
  if (!post) notFound();

  return (
    <>
    <ThemeToggle />
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold leading-snug">{post.title}</h1>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Link href={`/${username}`} className="hover:underline underline-offset-2">
            {username}
          </Link>
          {post.publishedAt && (
            <>
              <span>·</span>
              <span>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </>
          )}
        </div>
      </header>

      <article className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
        {post.content}
      </article>
    </main>
    </>
  );
}
