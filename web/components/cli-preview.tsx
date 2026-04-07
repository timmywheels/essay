"use client";

import { useEffect, useState } from "react";

const lines = [
  "essay auth",
  "essay new \"on building in public\"",
  "essay list",
  "essay publish on-building-in-public",
];

export function CliPreview() {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "pause" | "erasing">("typing");

  useEffect(() => {
    const current = lines[lineIndex];

    if (phase === "typing") {
      if (displayed.length < current.length) {
        const t = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 45);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("pause"), 1800);
        return () => clearTimeout(t);
      }
    }

    if (phase === "pause") {
      const t = setTimeout(() => setPhase("erasing"), 400);
      return () => clearTimeout(t);
    }

    if (phase === "erasing") {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 20);
        return () => clearTimeout(t);
      } else {
        setLineIndex((i) => (i + 1) % lines.length);
        setPhase("typing");
      }
    }
  }, [displayed, phase, lineIndex]);

  return (
    <div className="font-mono text-xs flex items-center gap-2" style={{ color: "var(--muted)" }}>
      <span style={{ opacity: 0.4 }}>$</span>
      <span>{displayed}</span>
      <span className="animate-pulse" style={{ opacity: 0.5 }}>▋</span>
    </div>
  );
}
