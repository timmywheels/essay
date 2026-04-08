import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ThemeToggle } from "@/components/theme-toggle";

export const revalidate = 60;

async function getPostAndUser(username: string, slug: string) {
  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, name: true, showUsername: true, profilePublic: true },
  });
  if (!user) return null;
  const post = await db.post.findFirst({ where: { userId: user.id, slug, published: true, public: true } });
  if (!post) return null;
  return { post, user };
}

export async function generateMetadata({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params;
  const result = await getPostAndUser(username, slug);
  if (!result) return {};
  return { title: result.post.title };
}

export default async function PostPage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params;
  const [result, session] = await Promise.all([getPostAndUser(username, slug), auth()]);
  if (!result) notFound();
  const { post, user } = result;
  if (!user.profilePublic && session?.user?.id !== user.id) notFound();

  const host = (await headers()).get("host") ?? "";
  const isCustomDomain = host !== "essay.sh" && host !== "www.essay.sh" && !host.endsWith(".vercel.app") && !host.startsWith("localhost");

  return (
    <>
    <ThemeToggle />
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold leading-snug">{post.title}</h1>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
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
