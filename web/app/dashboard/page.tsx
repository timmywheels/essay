import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { posts: { orderBy: { createdAt: "desc" } } },
  });

  if (!user) redirect("/api/auth/signout");
  if (!user.username) redirect("/onboarding");

  const needsGitHub = !user.githubInstallationId;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">
      {needsGitHub && (
        <div className="text-xs flex items-center gap-3" style={{ color: "var(--muted)" }}>
          <span>Connect a GitHub repo to start publishing.</span>
          <Link
            href="/connect"
            className="underline decoration-dotted underline-offset-2 transition-colors"
          >
            Connect repo →
          </Link>
        </div>
      )}

      <header className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          essay.sh/{user.username}
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/new"
            className="text-xs border px-3 py-1.5 transition-opacity hover:opacity-70"
            style={{ borderStyle: "dashed", borderColor: "var(--border)", color: "var(--foreground)", borderRadius: 0 }}
          >
            new post
          </Link>
          <form action={async () => { "use server"; await signOut(); }}>
            <button
              type="submit"
              className="text-xs transition-opacity hover:opacity-60"
              style={{ color: "var(--muted)" }}
            >
              sign out
            </button>
          </form>
        </div>
      </header>

      {user.posts.length === 0 ? (
        <div className="py-16 text-center text-sm" style={{ color: "var(--muted)" }}>
          No posts yet.{" "}
          <Link href="/dashboard/new" className="underline decoration-dotted underline-offset-2">
            Write your first one.
          </Link>
        </div>
      ) : (
        <ul style={{ borderTop: "1px solid var(--border)" }}>
          {user.posts.map((post) => (
            <li key={post.id} className="py-4 flex items-center justify-between gap-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                  {post.title || "Untitled"}
                </p>
                <p className="text-xs mt-0.5 flex items-center gap-2" style={{ color: "var(--muted)" }}>
                  {post.published ? (
                    <Link href={`/${user.username}/${post.slug}`} className="hover:underline">
                      /{user.username}/{post.slug}
                    </Link>
                  ) : (
                    <span>draft</span>
                  )}
                  {post.published && !post.public && <span>· private</span>}
                </p>
              </div>
              <Link
                href={`/dashboard/posts/${post.id}`}
                className="shrink-0 text-xs transition-opacity hover:opacity-60"
                style={{ color: "var(--muted)" }}
              >
                edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
