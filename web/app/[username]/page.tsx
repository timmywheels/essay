import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";

export const revalidate = 60;

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const user = await db.user.findUnique({
    where: { username },
    include: {
      posts: {
        where: { published: true, public: true },
        orderBy: { publishedAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">
      <header>
        <h1 className="text-xl font-semibold">{username}</h1>
      </header>

      {user.posts.length === 0 ? (
        <p className="text-sm text-zinc-400">Nothing published yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {user.posts.map((post) => (
            <li key={post.id} className="py-4">
              <Link href={`/${username}/${post.slug}`} className="group space-y-1">
                <p className="text-sm font-medium group-hover:underline underline-offset-2">
                  {post.title}
                </p>
                {post.publishedAt && (
                  <p className="text-xs text-zinc-400">
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
