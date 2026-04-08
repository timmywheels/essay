import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ActivityCalendar } from "@/components/activity-calendar";
import { DeletePostButton } from "@/components/delete-post-button";
import { ProfileMenu } from "@/components/profile-menu";

function generateDemoDates() {
  const dates: Date[] = [];
  const now = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - Math.floor(Math.random() * 365));
    dates.push(d);
  }
  return dates;
}

export default async function ProfilePage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ demo?: string }> }) {
  const { username } = await params;
  const { demo } = await searchParams;
  const host = (await headers()).get("host") ?? "";
  const isCustomDomain = host !== "essay.sh" && host !== "www.essay.sh" && !host.endsWith(".vercel.app") && !host.startsWith("localhost");

  const [session, user] = await Promise.all([
    auth(),
    db.user.findUnique({
      where: { username },
      include: { posts: { orderBy: { createdAt: "desc" } } },
    }),
  ]);

  if (!user) notFound();

  const isOwner = session?.user?.id === user.id;
  if (!user.profilePublic && !isOwner) notFound();
  const visiblePosts = isOwner ? user.posts : user.posts.filter((p) => p.published && p.public);
  const publishedPosts = user.posts.filter((p) => p.published && p.publishedAt);
  const publicPosts = publishedPosts.filter((p) => p.public);
  const hasPublished = publicPosts.length > 0;

  const calendarDates = demo != null || !hasPublished
    ? generateDemoDates()
    : (isOwner ? publishedPosts : publicPosts).map((p) => p.publishedAt as Date);

  const postsMap = Object.fromEntries(
    publicPosts.map((p) => [
      p.publishedAt!.toISOString().split("T")[0],
      { title: p.title, slug: p.slug },
    ])
  );

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">
      {isOwner && !user.githubInstallationId && (
        <div className="text-xs flex items-center gap-3" style={{ color: "var(--muted)" }}>
          <span>Connect a GitHub repo to start publishing.</span>
          <Link href="/connect" className="underline decoration-dotted underline-offset-2">
            Connect repo →
          </Link>
        </div>
      )}

      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>{username}</h1>
          {isOwner && (
            <Link
              href="/dashboard/new"
              className="text-xs border px-3 py-1.5 transition-opacity hover:opacity-70"
              style={{ borderStyle: "dashed", borderColor: "var(--border)", color: "var(--foreground)", borderRadius: 0 }}
            >
              new post
            </Link>
          )}
        </div>

        {hasPublished || demo != null ? (
          <ActivityCalendar publishedDates={calendarDates} username={username} posts={postsMap} />
        ) : (
          <div style={{ position: "relative" }}>
            <div style={{ filter: "blur(2px)", opacity: 0.5 }}>
              <ActivityCalendar publishedDates={generateDemoDates()} username={username} interactive={false} />
            </div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <p style={{ fontSize: "13px", color: "var(--foreground)", letterSpacing: "0.02em" }}>nothing published yet</p>
            </div>
          </div>
        )}
      </header>

      {visiblePosts.length === 0 ? (
        isOwner ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No posts yet.{" "}
            <Link href="/dashboard/new" className="underline decoration-dotted underline-offset-2">
              Write your first one.
            </Link>
          </p>
        ) : null
      ) : (
        <ul className="space-y-6">
          {visiblePosts.map((post) => (
            <li key={post.id} className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-1">
                <Link
                  href={post.published ? (isCustomDomain ? `/${post.slug}` : `/${username}/${post.slug}`) : `/dashboard/posts/${post.id}`}
                  className="group"
                >
                  <p className="text-sm font-medium group-hover:underline underline-offset-2" style={{ color: "var(--foreground)" }}>
                    {post.title || "Untitled"}
                  </p>
                </Link>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {post.published
                    ? post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                      : "published"
                    : "draft"}
                  {post.published && !post.public && " · private"}
                </p>
              </div>
              {isOwner && (
                <div className="flex items-center gap-4 shrink-0">
                  <Link
                    href={`/dashboard/posts/${post.id}`}
                    className="text-xs transition-opacity hover:opacity-60"
                    style={{ color: "var(--muted)" }}
                  >
                    edit
                  </Link>
                  <DeletePostButton postId={post.id} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOwner && (
        <ProfileMenu
          initialDomain={user.customDomain ?? null}
          initialVerifiedAt={user.domainVerifiedAt?.toISOString() ?? null}
          initialProfilePublic={user.profilePublic}
        />
      )}
    </main>
  );
}
