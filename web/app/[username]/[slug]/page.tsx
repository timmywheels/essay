import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { after } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getInstallationOctokit, getPostContent, getLastCommitSha } from "@/lib/github";
import { EssayBadge } from "@/components/essay-badge";
import { PostNav } from "@/components/post-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { PostSpinner } from "@/components/post-spinner";
import { StreamingMarkdown } from "@/components/streaming-markdown";
import { PgPostPage } from "@/components/pg-post-page";
import { PgSidebar } from "@/components/pg-sidebar";
import Editor from "@/components/editor";
import { UserAnalytics } from "@/components/user-analytics";

export const dynamic = "force-dynamic";

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

function ContentSkeleton() {
  return <PostSpinner />;
}

async function GitHubContent({
  installationId,
  githubUsername,
  githubRepo,
  slug,
}: {
  installationId: string;
  githubUsername: string;
  githubRepo: string;
  slug: string;
}) {
  const octokit = await getInstallationOctokit(installationId);
  const content = await getPostContent(octokit, githubUsername, githubRepo, slug);
  return content
    ? <StreamingMarkdown content={content} />
    : <p className="text-sm" style={{ color: "var(--muted)" }}>content unavailable</p>;
}

export async function generateMetadata({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params;
  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, name: true, settings: { select: { showUsername: true } } },
  });
  if (!user) return {};
  const post = await db.post.findFirst({ where: { userId: user.id, slug, published: true, public: true } });
  if (!post) return {};
  const author = user.name || (user.settings?.showUsername ? username : undefined);
  return {
    title: post.title,
    openGraph: { title: post.title, type: "article", ...(author && { authors: [author] }) },
    twitter: { card: "summary", title: post.title },
  };
}

export default async function PostPage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params;
  const session = await auth();

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      githubInstallationId: true,
      githubRepo: true,
      githubUsername: true,
      settings: {
        select: {
          showUsername: true,
          profilePublic: true,
          theme: true,
          links: true,
          analyticsId: true,
        },
      },
    },
  });
  if (!user) notFound();

  const s = user.settings;
  const isOwner = session?.user?.id === user.id;

  const post = await db.post.findFirst({
    where: {
      userId: user.id,
      slug,
      ...(isOwner ? {} : { published: true, public: true }),
    },
  });
  if (!post) notFound();
  if (!s?.profilePublic && !isOwner) notFound();

  const host = (await headers()).get("host") ?? "";
  const isCustomDomain = host !== "essay.sh" && host !== "www.essay.sh" && !host.endsWith(".vercel.app") && !host.startsWith("localhost");
  const hasGitHub = !!(user.githubInstallationId && user.githubRepo && user.githubUsername);
  const displayName = user.name || (s?.showUsername ? username : null);

  // PG theme — owner gets PG-styled editor, visitors get PG reading view
  if (s?.theme === "pg") {
    if (isOwner) {
      let content: string | null = null;
      let commitSha: string | null = null;
      if (hasGitHub) {
        const octokit = await getInstallationOctokit(user.githubInstallationId!);
        [content, commitSha] = await Promise.all([
          getPostContent(octokit, user.githubUsername!, user.githubRepo!, slug),
          post.published ? getLastCommitSha(octokit, user.githubUsername!, user.githubRepo!, slug) : Promise.resolve(null),
        ]);
      }
      return (
        <div className="pg">
          <style dangerouslySetInnerHTML={{ __html: `html,body{background:#fff}` }} />
          <PgSidebar username={username} isCustomDomain={isCustomDomain} links={(s.links as { label: string; url: string }[]) ?? []} />
          <Editor
            username={username}
            post={{ id: post.id, title: post.title, content: content ?? "", slug: post.slug, published: post.published, public: post.public }}
            commitSha={commitSha}
            github={hasGitHub ? { username: user.githubUsername!, repo: user.githubRepo! } : null}
          />
        </div>
      );
    }

    after(() => db.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } }));

    const [prevPost, nextPost] = await Promise.all([
      post.publishedAt ? db.post.findFirst({ where: { userId: user.id, published: true, public: true, publishedAt: { lt: post.publishedAt } }, orderBy: { publishedAt: "desc" }, select: { slug: true } }) : null,
      post.publishedAt ? db.post.findFirst({ where: { userId: user.id, published: true, public: true, publishedAt: { gt: post.publishedAt } }, orderBy: { publishedAt: "asc" }, select: { slug: true } }) : null,
    ]);
    const base = isCustomDomain ? "" : `/${username}`;

    return (
      <>
        <UserAnalytics measurementId={s.analyticsId} />
        <PgPostPage
          username={username}
          isCustomDomain={isCustomDomain}
          links={(s.links as { label: string; url: string }[]) ?? []}
          displayName={displayName}
          profilePublic={s.profilePublic}
          post={{ title: post.title, slug: post.slug, publishedAt: post.publishedAt, views: post.views }}
          github={hasGitHub ? { installationId: user.githubInstallationId!, username: user.githubUsername!, repo: user.githubRepo! } : null}
          prevHref={prevPost ? `${base}/${prevPost.slug}` : null}
          nextHref={nextPost ? `${base}/${nextPost.slug}` : null}
        />
      </>
    );
  }

  // Non-PG theme — owner gets editor
  if (isOwner) {
    let content: string | null = null;
    let commitSha: string | null = null;
    if (hasGitHub) {
      const octokit = await getInstallationOctokit(user.githubInstallationId!);
      [content, commitSha] = await Promise.all([
        getPostContent(octokit, user.githubUsername!, user.githubRepo!, slug),
        post.published ? getLastCommitSha(octokit, user.githubUsername!, user.githubRepo!, slug) : Promise.resolve(null),
      ]);
    }
    return (
      <Editor
        username={username}
        post={{ id: post.id, title: post.title, content: content ?? "", slug: post.slug, published: post.published, public: post.public }}
        commitSha={commitSha}
        github={hasGitHub ? { username: user.githubUsername!, repo: user.githubRepo! } : null}
        variant={(!s?.theme || s.theme === "default") ? "default" : "gr"}
      />
    );
  }

  after(() => db.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } }));

  const [prevPost, nextPost] = await Promise.all([
    post.publishedAt ? db.post.findFirst({ where: { userId: user.id, published: true, public: true, publishedAt: { lt: post.publishedAt } }, orderBy: { publishedAt: "desc" }, select: { slug: true } }) : null,
    post.publishedAt ? db.post.findFirst({ where: { userId: user.id, published: true, public: true, publishedAt: { gt: post.publishedAt } }, orderBy: { publishedAt: "asc" }, select: { slug: true } }) : null,
  ]);
  const base = isCustomDomain ? "" : `/${username}`;
  const prevHref = prevPost ? `${base}/${prevPost.slug}` : null;
  const nextHref = nextPost ? `${base}/${nextPost.slug}` : null;

  // Default theme: bordered column layout matching profile page aesthetic
  if (!s?.theme || s.theme === "default") {
    return (
      <div>
        <UserAnalytics measurementId={s?.analyticsId} />
        <div className="max-w-2xl mx-auto" style={{
          borderLeft: "1px dashed var(--border)",
          borderRight: "1px dashed var(--border)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Top nav */}
          <div style={{ borderBottom: "1px dashed var(--border)" }}>
            <div className="px-6 py-3 flex items-center justify-between">
              {s?.profilePublic ? (
                <Link href={isCustomDomain ? "/" : `/${username}`}
                  className="text-xs transition-opacity hover:opacity-60"
                  style={{ color: "var(--muted)" }}>
                  ← {displayName || username}
                </Link>
              ) : <span />}
              <ThemeToggle className="transition-opacity hover:opacity-60" />
            </div>
          </div>

          {/* Title / meta */}
          <div style={{ borderBottom: "1px dashed var(--border)" }}>
            <div className="px-6 py-10 space-y-2">
              <h1 className="text-2xl font-semibold leading-snug">{post.title}</h1>
              <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
                <div className="flex items-center gap-2">
                  {post.publishedAt && (
                    <>
                      <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                      <span style={{ opacity: 0.5 }}>({timeAgo(new Date(post.publishedAt))})</span>
                    </>
                  )}
                </div>
                <span>{post.views.toLocaleString()} views</span>
              </div>
            </div>
          </div>

          {/* Content — flex: 1 pushes nav to viewport bottom */}
          <div className="px-6 py-10" style={{ flex: 1 }}>
            {hasGitHub ? (
              <Suspense fallback={<ContentSkeleton />}>
                <GitHubContent
                  installationId={user.githubInstallationId!}
                  githubUsername={user.githubUsername!}
                  githubRepo={user.githubRepo!}
                  slug={slug}
                />
              </Suspense>
            ) : (
              <article className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                content unavailable
              </article>
            )}
          </div>

          {/* Post navigation */}
          <div style={{ borderTop: "1px dashed var(--border)" }}>
            <div className="px-6 py-4">
              <PostNav prevHref={prevHref} nextHref={nextHref} />
            </div>
          </div>
        </div>
        <EssayBadge username={username} />
      </div>
    );
  }

  // GR theme fallback
  return (
    <div>
      <UserAnalytics measurementId={s?.analyticsId} />
      <ThemeToggle />
      <main className="max-w-2xl mx-auto px-6 py-12" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div className="space-y-10" style={{ flex: 1 }}>
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold leading-snug">{post.title}</h1>
            <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
              <div className="flex items-center gap-2">
                {s?.profilePublic && (
                  <Link href={isCustomDomain ? "/" : `/${username}`} className="hover:underline underline-offset-2">
                    {user.name || (s.showUsername ? username : "←")}
                  </Link>
                )}
                {post.publishedAt && (
                  <>
                    {s?.profilePublic && <span>·</span>}
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

          {hasGitHub ? (
            <Suspense fallback={<ContentSkeleton />}>
              <GitHubContent
                installationId={user.githubInstallationId!}
                githubUsername={user.githubUsername!}
                githubRepo={user.githubRepo!}
                slug={slug}
              />
            </Suspense>
          ) : (
            <article className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              content unavailable
            </article>
          )}
        </div>
        <PostNav prevHref={prevHref} nextHref={nextHref} />
      </main>
      <EssayBadge username={username} />
    </div>
  );
}
