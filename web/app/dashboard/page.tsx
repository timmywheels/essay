import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { signOut } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { posts: { orderBy: { createdAt: "desc" } } },
  });

  if (!user?.username) redirect("/onboarding");

  const needsGitHub = !user.githubInstallationId;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">
      {needsGitHub && (
        <div className="text-xs text-zinc-400 flex items-center gap-3">
          <span>Connect a GitHub repo to start publishing.</span>
          <Link
            href="/connect"
            className="underline decoration-dotted underline-offset-2 hover:text-zinc-600 transition-colors"
          >
            Connect repo →
          </Link>
        </div>
      )}
      <header className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">essay.sh/{user.username}</span>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/new"
            className="inline-flex h-8 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            New post
          </Link>
          <form action={async () => { "use server"; await signOut(); }}>
            <button type="submit" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {user.posts.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-400">
          No posts yet.{" "}
          <Link href="/dashboard/new" className="underline underline-offset-2">
            Write your first one.
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {user.posts.map((post) => (
            <li key={post.id} className="py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{post.title || "Untitled"}</p>
                <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                  {post.published ? (
                    <Link href={`/${user.username}/${post.slug}`} className="hover:underline">
                      /{user.username}/{post.slug}
                    </Link>
                  ) : (
                    <span>Draft</span>
                  )}
                  {post.published && !post.public && (
                    <span className="text-zinc-300">· private</span>
                  )}
                </p>
              </div>
              <Link
                href={`/dashboard/posts/${post.id}`}
                className="shrink-0 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
