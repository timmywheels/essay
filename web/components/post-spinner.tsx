"use client";

import { useEffect, useState } from "react";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function PostSpinner() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % FRAMES.length), 50);
    return () => clearInterval(t);
  }, []);
  return (
    <span
      className="opacity-30 dark:opacity-60"
      style={{
        fontFamily: "var(--font-geist-mono)",
        fontSize: "24px",
        color: "var(--muted)",
      }}
    >
      {FRAMES[i]}
    </span>
  );
}
