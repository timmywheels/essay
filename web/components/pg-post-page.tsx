import Link from "next/link";
import { getInstallationOctokit, getPostContent } from "@/lib/github";
import { PgSidebar } from "@/components/pg-sidebar";
import { PgWatermark } from "@/components/pg-watermark";
import { Markdown } from "@/components/markdown";
import { EssayBadge } from "@/components/essay-badge";
import { PostNav } from "@/components/post-nav";

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

export async function PgPostPage({ username, isCustomDomain, links, displayName, profilePublic, post, github, prevHref, nextHref }: Props) {
  let content: string | null = null;
  if (github) {
    const octokit = await getInstallationOctokit(github.installationId);
    content = await getPostContent(octokit, github.username, github.repo, post.slug);
  }

  return (
    <div className="pg">
      <style dangerouslySetInnerHTML={{ __html: `html,body{background:#fff}` }} />
      <PgSidebar username={username} isCustomDomain={isCustomDomain} links={links} />
      {displayName && <PgWatermark name={displayName} />}
      <main className="max-w-2xl px-6 py-12" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div className="space-y-6" style={{ flex: 1 }}>
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold leading-snug">{post.title}</h1>
            {post.publishedAt && (
              <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                {new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
              </p>
            )}
          </header>

          {content ? (
            <Markdown content={content} />
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
