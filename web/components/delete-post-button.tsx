"use client";

import { useState } from "react";
import { deletePost } from "@/app/dashboard/actions";

export function DeletePostButton({ postId }: { postId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  if (confirming) {
    return (
      <span className="flex items-center gap-2 text-xs">
        <button
          onClick={async () => {
            setPending(true);
            await deletePost(postId);
          }}
          disabled={pending}
          className="transition-opacity hover:opacity-60"
          style={{ color: "var(--foreground)" }}
        >
          {pending ? "..." : "yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="transition-opacity hover:opacity-60"
          style={{ color: "var(--muted)" }}
        >
          no
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="shrink-0 text-xs transition-opacity hover:opacity-60"
      style={{ color: "var(--muted)" }}
    >
      delete
    </button>
  );
}
