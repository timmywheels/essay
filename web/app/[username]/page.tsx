import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { Link2Icon } from "@radix-ui/react-icons";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ActivityCalendar } from "@/components/activity-calendar";
import { PostList, DefaultPostList } from "@/components/post-list";
import { ProfileMenu } from "@/components/profile-menu";
import { EssayBadge } from "@/components/essay-badge";
import { PgProfilePage } from "@/components/pg-profile-page";
import { TextSelectIcon } from "@/components/icons/text-select-icon";

type LinkItem = { label: string; url: string };

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

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await db.user.findUnique({
    where: { username },
    select: { name: true, settings: { select: { bio: true, profilePublic: true } } },
  });
  if (!user?.settings?.profilePublic) return {};
  const displayName = user.name || username;
  return {
    title: displayName,
    description: user.settings.bio || `Essays by ${displayName}.`,
    openGraph: { title: displayName, description: user.settings.bio || `Essays by ${displayName}.` },
  };
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
      include: {
        posts: { orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }] },
        settings: true,
      },
    }),
  ]);

  if (!user) notFound();

  const s = user.settings;
  const isOwner = session?.user?.id === user.id;
  if (!s?.profilePublic && !isOwner) notFound();

  const visiblePosts = isOwner ? user.posts : user.posts.filter((p) => p.published && p.public);
  const publishedPosts = user.posts.filter((p) => p.published && p.publishedAt);
  const publicPosts = publishedPosts.filter((p) => p.public);
  const hasPublished = publicPosts.length > 0;
  const displayName = user.name || username;

  if (s?.theme === "pg") {
    const pgPosts = [...visiblePosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return (
      <PgProfilePage
        username={username}
        isCustomDomain={isCustomDomain}
        links={(s.links as LinkItem[]) ?? []}
        displayName={displayName}
        bio={s.bio}
        posts={pgPosts}
        isOwner={isOwner}
      />
    );
  }

  const calendarDates = demo != null || !hasPublished
    ? generateDemoDates()
    : (isOwner ? publishedPosts : publicPosts).map((p) => p.publishedAt as Date);

  const postsMap = Object.fromEntries(
    (isOwner ? publishedPosts : publicPosts).map((p) => [
      p.publishedAt!.toISOString().split("T")[0],
      { title: p.title, slug: p.slug },
    ])
  );

  const linkItems = Array.isArray(s?.links) && s.links.length > 0
    ? (s.links as LinkItem[]).map((link) => {
        let display = link.label;
        if (!display) {
          try { const u = new URL(link.url); display = (u.hostname + u.pathname.replace(/\/$/, "")).replace(/^www\./, ""); } catch { display = link.url; }
        }
        if (display.length > 30) display = display.slice(0, 28) + "…";
        let href = link.url;
        try {
          const u = new URL(link.url);
          u.searchParams.set("utm_source", "essay.sh");
          u.searchParams.set("utm_medium", "profile");
          u.searchParams.set("utm_campaign", username);
          href = u.toString();
        } catch { /* keep original */ }
        return { display, href, key: link.url };
      })
    : [];

  const activityGraph = s?.showActivityGraph ? (
    hasPublished || demo != null ? (
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
    )
  ) : null;

  // "default" = landing-page-inspired sectioned layout with dashed borders
  if (!s?.theme || s.theme === "default") {
    return (
      <div>
        <div className="max-w-2xl mx-auto" style={{ borderLeft: "1px dashed var(--border)", borderRight: "1px dashed var(--border)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {isOwner && !user.githubInstallationId && (
            <div style={{ borderBottom: "1px dashed var(--border)" }}>
              <div className="px-6 py-3 text-xs flex items-center gap-3" style={{ color: "var(--muted)" }}>
                <span>Connect a GitHub repo to start publishing.</span>
                <Link href="/connect" className="underline decoration-dotted underline-offset-2">Connect repo →</Link>
              </div>
            </div>
          )}

          {/* Header section */}
          <div style={{ borderBottom: "1px dashed var(--border)" }}>
            <div className="px-6 py-12">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2">
                  {(user.name || s?.showUsername) && (
                    <h1 className="text-3xl font-semibold" style={{ color: "var(--heading)" }}>{user.name || username}</h1>
                  )}
                  {user.name && s?.showUsername && <p className="text-xs" style={{ color: "var(--muted)" }}>{username}</p>}
                  {s?.bio && <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{s.bio}</p>}
                  {linkItems.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                      {linkItems.map(({ display, href, key }) => (
                        <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs transition-opacity hover:opacity-60"
                          style={{ color: "var(--muted)" }}>
                          <Link2Icon />{display}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                {isOwner && (
                  <Link href="/dashboard/new"
                    className="text-xs px-3 py-1.5 shrink-0 transition-opacity hover:opacity-70"
                    style={{ border: "1px dashed var(--border)", color: "var(--foreground)", borderRadius: 0 }}>
                    + new post
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Activity graph section */}
          {activityGraph && (
            <div style={{ borderBottom: "1px dashed var(--border)" }}>
              <div className="px-6 py-8">
                {activityGraph}
              </div>
            </div>
          )}

          {/* Posts section — flex:1, no px-6: DefaultPostList owns all horizontal spacing */}
          <div style={{ flex: 1, position: "relative" }}>
            {/* Vertical line: w-10 year col + gap = 3.5rem from section left edge */}
            {visiblePosts.length > 0 && (
              <div aria-hidden style={{
                position: "absolute",
                left: "calc(2.5rem + 1rem)",
                top: 0, bottom: 0,
                borderLeft: "1px dashed var(--border)",
                pointerEvents: "none",
              }} />
            )}
            {visiblePosts.length === 0 ? (
              isOwner ? (
                <p className="px-6 py-4 text-sm" style={{ color: "var(--muted)" }}>
                  No posts yet.{" "}
                  <Link href="/dashboard/new" className="underline decoration-dotted underline-offset-2">Write your first one.</Link>
                </p>
              ) : null
            ) : (
              <DefaultPostList posts={visiblePosts} isOwner={isOwner} isCustomDomain={isCustomDomain} username={username} />
            )}
          </div>

          {/* essay.sh badge — attached to column bottom, nav-button style */}
          <Link
            href={`https://essay.sh?ref=${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-end gap-2 px-6 py-5 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ borderTop: "1px dashed var(--border)", color: "var(--muted)" }}
          >
            <TextSelectIcon size={16} color="var(--muted)" />
            essay.sh
          </Link>
        </div>

        {isOwner && <ProfileMenu />}
      </div>
    );
  }

  // "gr" = rauchg-inspired compact layout
  return (
    <div>
      <main className="max-w-2xl mx-auto px-6 py-12 space-y-6">
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
            <div className="space-y-1">
              {(user.name || s?.showUsername) && (
                <h1 className="text-xl font-semibold" style={{ color: "var(--heading)" }}>{user.name || username}</h1>
              )}
              {user.name && s?.showUsername && <p className="text-xs" style={{ color: "var(--muted)" }}>{username}</p>}
              {s?.bio && <p className="text-sm" style={{ color: "var(--muted)" }}>{s.bio}</p>}
              {linkItems.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                  {linkItems.map(({ display, href, key }) => (
                    <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs transition-opacity hover:opacity-60"
                      style={{ color: "var(--muted)" }}>
                      <Link2Icon />{display}
                    </a>
                  ))}
                </div>
              )}
            </div>
            {isOwner && (
              <Link
                href="/dashboard/new"
                className="text-xs border px-3 py-1.5 transition-opacity hover:opacity-70 shrink-0"
                style={{ borderStyle: "dashed", borderColor: "var(--border)", color: "var(--foreground)", borderRadius: 0 }}
              >
                + new post
              </Link>
            )}
          </div>

          {activityGraph && <div className="space-y-2">{activityGraph}</div>}
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
          <PostList
            posts={visiblePosts}
            isOwner={isOwner}
            isCustomDomain={isCustomDomain}
            username={username}
          />
        )}

        {isOwner && <ProfileMenu />}

        <EssayBadge username={username} />
      </main>
    </div>
  );
}
