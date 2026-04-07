"use client";

import { useState } from "react";

const CMD = "curl -fsSL essay.sh/install | sh";

export function CopyInstall() {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      onClick={copy}
      className="font-mono transition-opacity hover:opacity-70"
      style={{ fontSize: "10px", color: "var(--muted)", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "3px" }}
    >
      {copied ? "copied!" : CMD}
    </button>
  );
}
