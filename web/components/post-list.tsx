"use client";

import { useState, useEffect, Fragment } from "react";
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

interface SharedProps {
  posts: PostItem[];
  isOwner: boolean;
  isCustomDomain: boolean;
  username: string;
}

function usePostHighlight() {
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
  return highlightedSlug;
}

function postHref(post: PostItem, isCustomDomain: boolean, username: string) {
  return post.published
    ? isCustomDomain
      ? `/${post.slug}`
      : `/${username}/${post.slug}`
    : `/${username}/${post.slug}`;
}

// GR theme — compact list, border only on content column
export function PostList({
  posts,
  isOwner,
  isCustomDomain,
  username,
}: SharedProps) {
  const highlightedSlug = usePostHighlight();

  return (
    <ul className="space-y-0">
      {posts.map((post, i) => {
        const year = post.publishedAt
          ? new Date(post.publishedAt).getFullYear()
          : null;
        const prevYear =
          i > 0 && posts[i - 1].publishedAt
            ? new Date(posts[i - 1].publishedAt!).getFullYear()
            : null;
        const showYear = year !== null && year !== prevYear;
        const href = postHref(post, isCustomDomain, username);

        return (
          <li
            key={post.id}
            id={`post-${post.slug}`}
            className="group flex items-baseline gap-4"
            style={{
              opacity:
                highlightedSlug && post.slug !== highlightedSlug ? 0.2 : 1,
              transition: "opacity 0.5s ease",
            }}
          >
            <span
              className="w-10 shrink-0 text-xs tabular-nums"
              style={{ color: "var(--muted)", opacity: showYear ? 1 : 0 }}
            >
              {year}
            </span>
            <div
              className="flex flex-1 items-baseline gap-4 py-2 min-w-0"
              style={{ borderBottom: "1px dashed var(--border)" }}
            >
              <Link
                href={href}
                className="flex-1 min-w-0 text-sm hover:underline underline-offset-2 truncate"
                style={{ color: "var(--link)" }}
              >
                {post.title || "Untitled"}
                {post.published && !post.public && (
                  <span
                    className="ml-2 text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    private
                  </span>
                )}
                {!post.published && (
                  <span
                    className="ml-2 text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    draft
                  </span>
                )}
              </Link>
              <div
                className="flex items-center gap-3 shrink-0 text-xs tabular-nums"
                style={{ color: "var(--muted)" }}
              >
                {isOwner && (
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/${username}/${post.slug}`}
                      className="hover:opacity-60"
                    >
                      edit
                    </Link>
                    <DeletePostButton postId={post.id} />
                  </div>
                )}
                {post.published && <span>{post.views.toLocaleString()}</span>}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Default theme — two-column grid: year cell left of vertical line, content right
// The vertical line lives in the parent section (spans full height).
// Section has no px-6 — this component owns all horizontal spacing.
// Left cell = w-10 year col (2.5rem) + gap (1rem) = 3.5rem; content gets px-6 via padding.
const GRID_COLS = "calc(2.5rem + 1rem) 1fr";

export function DefaultPostList({
  posts,
  isOwner,
  isCustomDomain,
  username,
}: SharedProps) {
  const highlightedSlug = usePostHighlight();

  return (
    <ul className="space-y-0">
      {posts.map((post, i) => {
        const year = post.publishedAt
          ? new Date(post.publishedAt).getFullYear()
          : null;
        const prevYear =
          i > 0 && posts[i - 1].publishedAt
            ? new Date(posts[i - 1].publishedAt!).getFullYear()
            : null;
        const isNewYear = year !== null && year !== prevYear;
        const href = postHref(post, isCustomDomain, username);
        const isFirstYear = i === 0;
        return (
          <Fragment key={post.id}>
            {/* Post row */}
            <li
              id={`post-${post.slug}`}
              className="group"
              style={{
                display: "grid",
                gridTemplateColumns: GRID_COLS,
                opacity:
                  highlightedSlug && post.slug !== highlightedSlug ? 0.2 : 1,
                transition: "opacity 0.5s ease",
              }}
            >
              {/* Left cell: year label on first post of each group, with borderBottom */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...(isNewYear && {
                    ...(!isFirstYear && {
                      borderTop: "1px dashed var(--border)",
                    }),
                    borderBottom: "1px dashed var(--border)",
                  }),
                }}
              >
                {isNewYear && (
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: "var(--muted)" }}
                  >
                    {year}
                  </span>
                )}
              </div>

              {/* Right cell: post content, always has borderBottom */}
              <div
                className="flex items-baseline gap-4 py-2"
                style={{
                  paddingLeft: "1rem",
                  paddingRight: "1.5rem",
                  borderBottom: "1px dashed var(--border)",
                }}
              >
                <Link
                  href={href}
                  className="flex-1 min-w-0 text-sm hover:underline underline-offset-2 truncate"
                  style={{ color: "var(--link)" }}
                >
                  {post.title || "Untitled"}
                  {post.published && !post.public && (
                    <span
                      className="ml-2 text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      private
                    </span>
                  )}
                  {!post.published && (
                    <span
                      className="ml-2 text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      draft
                    </span>
                  )}
                </Link>
                <div
                  className="flex items-center gap-3 shrink-0 text-xs tabular-nums"
                  style={{ color: "var(--muted)" }}
                >
                  {isOwner && (
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/${username}/${post.slug}`}
                        className="hover:opacity-60"
                      >
                        edit
                      </Link>
                      <DeletePostButton postId={post.id} />
                    </div>
                  )}
                  {post.published && <span>{post.views.toLocaleString()}</span>}
                </div>
              </div>
            </li>
          </Fragment>
        );
      })}
    </ul>
  );
}
