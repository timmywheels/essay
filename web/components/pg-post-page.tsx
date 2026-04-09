import { Suspense } from "react";
import Link from "next/link";
import { getInstallationOctokit, getPostContent } from "@/lib/github";
import { PgSidebar } from "@/components/pg-sidebar";
import { PgWatermark } from "@/components/pg-watermark";
import { StreamingMarkdown } from "@/components/streaming-markdown";
import { PostSpinner } from "@/components/post-spinner";
import { EssayBadge } from "@/components/essay-badge";
import { PostNav } from "@/components/post-nav";

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

interface Props {
  username: string;
  isCustomDomain: boolean;
  links: { label: string; url: string }[];
  displayName: string | null;
  profilePublic: boolean;
  post: {
    title: string;
    slug: string;
    publishedAt: Date | null;
    views: number;
  };
  github: {
    installationId: string;
    username: string;
    repo: string;
  } | null;
  prevHref: string | null;
  nextHref: string | null;
}

export function PgPostPage({ username, isCustomDomain, links, displayName, profilePublic, post, github, prevHref, nextHref }: Props) {
  return (
    <div className="pg">
      <style dangerouslySetInnerHTML={{ __html: `html,body{background:#fff}` }} />
      <PgSidebar username={username} isCustomDomain={isCustomDomain} links={links} />
      {displayName && <PgWatermark name={displayName} />}
      <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold leading-snug">{post.title}</h1>
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
            <div className="flex items-center gap-2">
              {profilePublic && (
                <Link href={isCustomDomain ? "/" : `/${username}`} className="hover:underline underline-offset-2">
                  {displayName || "←"}
                </Link>
              )}
              {post.publishedAt && (
                <>
                  {profilePublic && <span>·</span>}
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

        {github ? (
          <Suspense fallback={<PostSpinner />}>
            <GitHubContent
              installationId={github.installationId}
              githubUsername={github.username}
              githubRepo={github.repo}
              slug={post.slug}
            />
          </Suspense>
        ) : (
          <article className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            content unavailable
          </article>
        )}
      </main>
      <EssayBadge username={username} />
      <PostNav prevHref={prevHref} nextHref={nextHref} />
    </div>
  );
}
