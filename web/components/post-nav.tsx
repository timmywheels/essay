"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  prevHref: string | null;
  nextHref: string | null;
}

export function PostNav({ prevHref, nextHref }: Props) {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if ((e.target as HTMLElement).closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowLeft" || e.key === "[") {
        if (prevHref) router.push(prevHref);
      } else if (e.key === "ArrowRight" || e.key === "]") {
        if (nextHref) router.push(nextHref);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prevHref, nextHref, router]);

  if (!prevHref && !nextHref) return null;

  return (
    <div
      className="flex items-center gap-4 text-xs select-none pt-8 pb-4"
      style={{ color: "var(--muted)", letterSpacing: "0.05em" }}
    >
      {prevHref ? <Link href={prevHref} style={{ color: "inherit", textDecoration: "none" }}>← prev</Link> : <span style={{ opacity: 0 }}>← prev</span>}
      {nextHref ? <Link href={nextHref} style={{ color: "inherit", textDecoration: "none" }}>next →</Link> : <span style={{ opacity: 0 }}>next →</span>}
    </div>
  );
}
