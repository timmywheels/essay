"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppMenu, AppMenuItem } from "@/components/app-menu";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { vim, Vim } from "@replit/codemirror-vim";
import { markdown } from "@codemirror/lang-markdown";
import { uniqueNamesGenerator, adjectives, animals } from "unique-names-generator";
import { motion, AnimatePresence } from "motion/react";
import { LockClosedIcon } from "@radix-ui/react-icons";

type Post = {
  id: string;
  title: string;
  content: string;
  slug: string;
  published: boolean;
  public: boolean;
};

type Props = {
  username: string;
  post?: Post;
};

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function generateSlug() {
  return uniqueNamesGenerator({ dictionaries: [adjectives, animals], separator: "-", style: "lowerCase" });
}

const baseTheme = EditorView.theme({
  "&": { fontSize: "14px", background: "transparent" },
  "&.cm-editor": { outline: "none", border: "none", background: "transparent" },
  "&.cm-editor.cm-focused": { outline: "none", border: "none" },
  ".cm-scroller": { background: "transparent" },
  ".cm-content": { fontFamily: "var(--font-geist-mono)", padding: "0 0 0 2px", minHeight: "60vh", caretColor: "var(--foreground)" },
  ".cm-focused": { outline: "none" },
  ".cm-line": { padding: "0", lineHeight: "1.75", color: "var(--foreground)" },
  ".cm-cursor": { borderLeftColor: "var(--foreground)" },
  ".cm-gutters": { display: "none" },
  ".cm-activeLine": { background: "transparent" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { background: "var(--border)" },
  ".cm-placeholder": { color: "var(--muted)" },
});

type SaveState = "idle" | "committing" | "pushing";

export default function Editor({ username, post }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [slug, setSlug] = useState(post?.slug ?? generateSlug());
  const [slugEdited, setSlugEdited] = useState(!!post?.slug);
  const [isPublic, setIsPublic] = useState(post?.public ?? true);
  const [isPublished, setIsPublished] = useState(post?.published ?? false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [vimMode, setVimMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("editor-vim-mode");
    if (stored === "true") setVimMode(true);
  }, []);

  const toggleVim = useCallback(() => {
    setVimMode((prev) => {
      localStorage.setItem("editor-vim-mode", String(!prev));
      return !prev;
    });
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slugEdited) setSlug(val ? slugify(val) : generateSlug());
  }, [slugEdited]);

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
    setSlugEdited(true);
  }, []);

  const save = useCallback(async (publish: boolean) => {
    if (saveState !== "idle") return;
    setSaveState(publish ? "pushing" : "committing");

    try {
      const res = await fetch(post ? `/api/posts/${post.id}` : "/api/posts", {
        method: post ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, slug, published: publish || isPublished, public: isPublic }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Something went wrong.");
        return;
      }

      const data = await res.json();

      if (!post) {
        router.push(`/${username}/${slug}`);
        return;
      }

      if (publish) {
        setIsPublished(true);
        router.push(isPublic ? `/${username}/${slug}` : `/${username}`);
        return;
      }

    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSaveState("idle");
    }
  }, [saveState, post, title, content, slug, isPublished, isPublic, username, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "s") {
        e.preventDefault();
        save(e.shiftKey); // ⌘S → commit, ⌘⇧S → push
      }
      if (e.key === "Enter") {
        e.preventDefault();
        save(true); // ⌘↵ → push
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save]);

  // Vim ex commands
  useEffect(() => {
    Vim.defineEx("write", "w", () => save(false));
    Vim.defineEx("wquit", "wq", () => save(false).then(() => router.push(`/${username}`)));
  }, [save, router, username]);

  const extensions = [markdown(), baseTheme, EditorView.lineWrapping];
  if (vimMode) extensions.push(vim());

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <Link href={`/${username}`} className="text-xs transition-opacity hover:opacity-60" style={{ color: "var(--muted)" }}>
          ← {username}
        </Link>

        <div className="flex items-center gap-5">
          {/* Visibility toggle */}
          <button
            onClick={() => setIsPublic((p) => !p)}
            className="flex items-center gap-1 text-xs underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-60"
            style={{ color: "var(--muted)" }}
          >
            {!isPublic && <LockClosedIcon width={10} height={10} />}
            {isPublic ? "public" : "private"}
          </button>

          {/* Commit */}
          <button
            onClick={() => save(false)}
            disabled={saveState !== "idle"}
            className={`text-xs underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-60 ${saveState === "committing" ? "text-shimmer" : ""}`}
            style={saveState === "committing" ? undefined : { color: "var(--muted)" }}
          >
            commit
          </button>

          {/* Push */}
          <button
            onClick={() => save(true)}
            disabled={saveState !== "idle" || !slug}
            className={`text-xs underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-60 ${saveState === "pushing" ? "text-shimmer" : ""}`}
            style={saveState === "pushing" ? undefined : { color: "var(--muted)" }}
          >
            push
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Title"
          className="w-full text-2xl font-semibold outline-none border-none bg-transparent"
          style={{ color: "var(--foreground)" }}
        />
        <div className="flex items-center gap-1 text-sm" style={{ color: "var(--muted)" }}>
          <span>essay.sh/{username}/</span>
          <input
            type="text"
            value={slug}
            onChange={handleSlugChange}
            placeholder="slug"
            className="flex-1 outline-none bg-transparent"
            style={{ color: "var(--muted)" }}
          />
        </div>
      </div>

      <AppMenu>
        <AppMenuItem onClick={toggleVim} indicator={vimMode}>
          <span className="font-mono">vim</span>
        </AppMenuItem>
      </AppMenu>

      <CodeMirror
        value={content}
        onChange={setContent}
        extensions={extensions}
        placeholder="Write something..."
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: false,
          bracketMatching: false,
          closeBrackets: false,
          autocompletion: false,
          highlightActiveLine: false,
          highlightSelectionMatches: false,
          searchKeymap: false,
          syntaxHighlighting: false,
        }}
      />
    </main>
  );
}
