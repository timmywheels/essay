"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import type { Components } from "react-markdown";

function FadeImage({ src, alt }: { src?: string; alt?: string }) {
  return (
    <img
      src={src}
      alt={alt ?? ""}
      className="max-w-full my-4"
      style={{ display: "block", animation: "fade-in 2s ease-out forwards" }}
    />
  );
}

export function Markdown({ content, streaming }: { content: string; streaming?: boolean }) {
  const components: Components = {
    p:          ({ children }) => <p className="leading-relaxed mb-4 last:mb-0">{children}</p>,
    h1:         ({ children }) => <h1 className="text-xl font-semibold mt-8 mb-3 first:mt-0" style={{ color: "var(--heading)" }}>{children}</h1>,
    h2:         ({ children }) => <h2 className="text-base font-semibold mt-7 mb-2" style={{ color: "var(--heading)" }}>{children}</h2>,
    h3:         ({ children }) => <h3 className="text-sm font-semibold mt-6 mb-1" style={{ color: "var(--heading)" }}>{children}</h3>,
    a:          ({ href, children }) => (
      <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
        className="underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-60"
        style={{ color: "var(--link)" }}>
        {children}
      </a>
    ),
    strong:     ({ children }) => <strong className="font-semibold">{children}</strong>,
    em:         ({ children }) => <em className="italic">{children}</em>,
    ul:         ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
    ol:         ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
    li:         ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="pl-4 my-4 italic" style={{ borderLeft: "2px solid var(--border)", color: "var(--muted)" }}>
        {children}
      </blockquote>
    ),
    hr:         () => <hr className="my-8" style={{ borderColor: "var(--border)", borderStyle: "dashed" }} />,
    img:        ({ src, alt }) => streaming ? null : <FadeImage src={typeof src === "string" ? src : undefined} alt={alt} />,
    code:       ({ children, className }) => {
      const isBlock = className?.startsWith("language-");
      if (isBlock) {
        return (
          <pre className="my-4 p-4 overflow-x-auto text-xs leading-relaxed" style={{ border: "1px dashed var(--border)", fontFamily: "var(--font-geist-mono)", color: "var(--foreground)" }}>
            <code>{children}</code>
          </pre>
        );
      }
      return (
        <code className="px-1 py-0.5 text-xs" style={{ fontFamily: "var(--font-geist-mono)", border: "1px dashed var(--border)", color: "var(--foreground)" }}>
          {children}
        </code>
      );
    },
    pre:        ({ children }) => <>{children}</>,
    table:      ({ children }) => <div className="overflow-x-auto my-4"><table className="w-full text-sm border-collapse">{children}</table></div>,
    th:         ({ children }) => <th className="text-left px-3 py-2 text-xs font-semibold" style={{ borderBottom: "1px dashed var(--border)", color: "var(--foreground)" }}>{children}</th>,
    td:         ({ children }) => <td className="px-3 py-2" style={{ borderBottom: "1px dashed var(--border)", color: "var(--foreground)" }}>{children}</td>,
  };

  return (
    <div className="text-sm" style={{ color: "var(--foreground)" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
