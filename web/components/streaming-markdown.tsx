"use client";

import { useEffect, useState } from "react";
import { Markdown } from "@/components/markdown";
import { PostSpinner } from "@/components/post-spinner";

const MIN_SPINNER_MS = 1600;
const CHARS_PER_FRAME = 6;

export function StreamingMarkdown({ content }: { content: string }) {
  // null = spinner phase, string = streaming/done
  const [displayed, setDisplayed] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let raf: number;

    const timer = setTimeout(() => {
      if (cancelled) return;
      let pos = 0;

      function frame() {
        if (cancelled) return;
        pos = Math.min(pos + CHARS_PER_FRAME, content.length);
        setDisplayed(content.slice(0, pos));
        if (pos < content.length) {
          raf = requestAnimationFrame(frame);
        } else {
          setStreaming(false);
        }
      }

      raf = requestAnimationFrame(frame);
    }, MIN_SPINNER_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [content]);

  if (displayed === null) return <PostSpinner />;
  return <Markdown content={displayed} streaming={streaming} />;
}
