"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs select-none pointer-events-none"
      style={{ color: "var(--muted)", opacity: 0.4, letterSpacing: "0.05em" }}
    >
      {prevHref ? <span>← prev</span> : <span style={{ opacity: 0 }}>← prev</span>}
      {nextHref ? <span>next →</span> : <span style={{ opacity: 0 }}>next →</span>}
    </div>
  );
}
