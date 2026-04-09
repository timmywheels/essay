"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DeletePostButton } from "@/components/delete-post-button";

export type PostItem = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  public: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  views: number;
};

interface Props {
  posts: PostItem[];
  isOwner: boolean;
  isCustomDomain: boolean;
  username: string;
}

export function PostList({ posts, isOwner, isCustomDomain, username }: Props) {
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      const slug = (e as CustomEvent<{ slug: string }>).detail.slug;
      setHighlightedSlug(slug);
      setTimeout(() => setHighlightedSlug(null), 1800);
    }
    window.addEventListener("post-highlight", handler);
    return () => window.removeEventListener("post-highlight", handler);
  }, []);

  return (
    <ul className="space-y-0">
      {posts.map((post, i) => {
        const year = post.publishedAt ? new Date(post.publishedAt).getFullYear() : null;
        const prevYear = i > 0 && posts[i - 1].publishedAt
          ? new Date(posts[i - 1].publishedAt!).getFullYear()
          : null;
        const showYear = year !== null && year !== prevYear;
        const href = post.published
          ? (isCustomDomain ? `/${post.slug}` : `/${username}/${post.slug}`)
          : `/${username}/${post.slug}`;

        return (
          <li
            key={post.id}
            id={`post-${post.slug}`}
            className="flex items-baseline gap-4"
            style={{
              opacity: highlightedSlug && post.slug !== highlightedSlug ? 0.2 : 1,
              transition: "opacity 0.5s ease",
            }}
          >
            <span className="w-10 shrink-0 text-xs tabular-nums" style={{ color: "var(--muted)", opacity: showYear ? 1 : 0 }}>
              {year}
            </span>
            <div className="flex flex-1 items-baseline gap-4 py-2 min-w-0" style={{ borderBottom: "1px dashed var(--border)" }}>
              <Link href={href} className="flex-1 min-w-0 text-sm hover:underline underline-offset-2 truncate" style={{ color: "var(--link)" }}>
                {post.title || "Untitled"}
                {post.published && !post.public && <span className="ml-2 text-xs" style={{ color: "var(--muted)" }}>private</span>}
                {!post.published && <span className="ml-2 text-xs" style={{ color: "var(--muted)" }}>draft</span>}
              </Link>
              <div className="flex items-center gap-3 shrink-0 text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                {post.published && <span>{post.views.toLocaleString()}</span>}
                {isOwner && (
                  <div className="flex items-center gap-3">
                    <Link href={`/${username}/${post.slug}`} className="hover:opacity-60">edit</Link>
                    <DeletePostButton postId={post.id} />
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
