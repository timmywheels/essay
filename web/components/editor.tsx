"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { vim, Vim } from "@replit/codemirror-vim";
import { markdown } from "@codemirror/lang-markdown";
import { uniqueNamesGenerator, adjectives, animals } from "unique-names-generator";
import { motion, AnimatePresence } from "motion/react";

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

type SaveState = "idle" | "saving" | "saved" | "publishing";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
    setSaveState(publish ? "publishing" : "saving");

    const res = await fetch(post ? `/api/posts/${post.id}` : "/api/posts", {
      method: post ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, slug, published: publish || isPublished, public: isPublic }),
    });

    if (!res.ok) {
      const data = await res.json();
      setSaveState("idle");
      alert(data.error || "Something went wrong.");
      return;
    }

    const data = await res.json();

    if (!post) {
      router.push(`/dashboard/posts/${data.id}`);
      return;
    }

    if (publish) {
      setIsPublished(true);
      router.push(isPublic ? `/${username}/${slug}` : `/${username}`);
      return;
    }

    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1800);
  }, [saveState, post, title, content, slug, isPublished, isPublic, username, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "s") {
        e.preventDefault();
        save(e.shiftKey); // ⌘S → save, ⌘⇧S → publish
      }
      if (e.key === "Enter") {
        e.preventDefault();
        save(true); // ⌘↵ → publish
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
            className="relative text-xs transition-opacity hover:opacity-60 overflow-hidden"
            style={{ color: "var(--muted)" }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={isPublic ? "public" : "private"}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -6, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="block"
              >
                {isPublic ? "public" : "private"}
              </motion.span>
            </AnimatePresence>
          </button>

          {/* Save */}
          <button
            onClick={() => save(false)}
            disabled={saveState !== "idle"}
            className="relative text-xs underline decoration-dotted underline-offset-2 disabled:opacity-50 transition-opacity hover:opacity-60 overflow-hidden"
            style={{ color: "var(--muted)" }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={saveState === "saved" ? "saved" : "save"}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -6, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="block"
              >
                {saveState === "saving" ? "saving…" : saveState === "saved" ? "saved" : "save"}
              </motion.span>
            </AnimatePresence>
          </button>

          {/* Publish */}
          <button
            onClick={() => save(true)}
            disabled={saveState !== "idle" || !slug}
            className="relative text-xs disabled:opacity-30 transition-opacity hover:opacity-60 overflow-hidden"
            style={{ color: "var(--foreground)" }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={saveState === "publishing" ? "ing" : isPublished ? "update" : "publish"}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -6, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="block"
              >
                {saveState === "publishing" ? "publishing…" : isPublished ? "update" : "publish"}
              </motion.span>
            </AnimatePresence>
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

      {/* Settings menu — top right, left of theme toggle */}
      <div className="fixed top-4 right-10 flex flex-col items-end">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="text-xs transition-opacity hover:opacity-60"
          style={{ color: "var(--muted)", letterSpacing: "0.1em" }}
        >
          ···
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              style={{
                border: "1px dashed var(--border)",
                background: "var(--background)",
                padding: "8px 12px",
                marginTop: "8px",
                minWidth: "120px",
              }}
            >
              <button
                onClick={() => mounted && setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center justify-between w-full text-xs transition-opacity hover:opacity-60"
                style={{ color: "var(--muted)" }}
              >
                <span>{mounted && theme === "dark" ? "light mode" : "dark mode"}</span>
              </button>
              <button
                onClick={toggleVim}
                className="flex items-center justify-between w-full text-xs transition-opacity hover:opacity-60"
                style={{ color: "var(--muted)" }}
              >
                <span className="font-mono">vim</span>
                <AnimatePresence>
                  {vimMode && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--foreground)" }}
                    />
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {menuOpen && (
        <div className="fixed inset-0" style={{ zIndex: -1 }} onClick={() => setMenuOpen(false)} />
      )}

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
