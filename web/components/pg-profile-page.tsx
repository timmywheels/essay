import Link from "next/link";
import { PgSidebar } from "@/components/pg-sidebar";
import { PgWatermark } from "@/components/pg-watermark";
import { PgProfileHeader } from "@/components/pg-profile-header";
import { EssayBadge } from "@/components/essay-badge";
import { ProfileMenu } from "@/components/profile-menu";
import type { PostItem } from "@/components/post-list";

interface Props {
  username: string;
  isCustomDomain: boolean;
  links: { label: string; url: string }[];
  displayName: string;
  bio?: string | null;
  posts: PostItem[];
  isOwner: boolean;
  profilePublic: boolean;
}

export function PgProfilePage({ username, isCustomDomain, links, displayName, bio, posts, isOwner, profilePublic }: Props) {
  return (
    <div className="pg">
      <style dangerouslySetInnerHTML={{ __html: `html,body{background:#fff}` }} />
      <PgSidebar username={username} isCustomDomain={isCustomDomain} links={links} />
      <PgWatermark name={displayName} />
      <main className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        <PgProfileHeader bio={bio} isOwner={isOwner} />
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {posts.map((post) => {
            const href = post.published
              ? (isCustomDomain ? `/${post.slug}` : `/${username}/${post.slug}`)
              : `/${username}/${post.slug}`;
            return (
              <li key={post.id} style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "2px", fontSize: "13px" }}>
                <span style={{ color: "var(--foreground)", flexShrink: 0 }}>▪</span>
                <Link href={href} style={{ color: "var(--link)", textDecoration: "underline" }}>
                  {post.title || "Untitled"}
                </Link>
                {isOwner && !post.published && <span style={{ color: "var(--muted)", fontSize: "11px" }}>draft</span>}
                {isOwner && post.published && !post.public && <span style={{ color: "var(--muted)", fontSize: "11px" }}>private</span>}
              </li>
            );
          })}
        </ul>
        {isOwner && <ProfileMenu initialProfilePublic={profilePublic} />}
        <EssayBadge username={username} />
      </main>
    </div>
  );
}
