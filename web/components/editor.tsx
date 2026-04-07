"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  "&.cm-editor": { outline: "none", border: "none" },
  "&.cm-editor.cm-focused": { outline: "none", border: "none" },
  ".cm-content": { fontFamily: "var(--font-geist-mono)", padding: "0", minHeight: "60vh", caretColor: "#171717" },
  ".cm-focused": { outline: "none" },
  ".cm-line": { padding: "0", lineHeight: "1.75" },
  ".cm-cursor": { borderLeftColor: "#171717" },
  ".cm-scroller": { overflow: "auto" },
  ".cm-gutters": { display: "none" },
  ".cm-activeLine": { background: "transparent" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { background: "#e4e4e7" },
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
      router.push(`/${username}/${slug}`);
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
    Vim.defineEx("write", "w", () => save(false));       // :w → save
    Vim.defineEx("wquit", "wq", () => save(false).then(() => router.push("/dashboard"))); // :wq → save + exit
  }, [save, router]);

  const extensions = [markdown(), baseTheme, EditorView.lineWrapping];
  if (vimMode) extensions.push(vim());

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
          ← dashboard
        </Link>

        <div className="flex items-center gap-5">
          {/* Vim toggle */}
          <button onClick={toggleVim} className="relative flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-600 transition-colors">
            vim
            <AnimatePresence>
              {vimMode && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="w-1 h-1 rounded-full bg-zinc-600 inline-block"
                />
              )}
            </AnimatePresence>
          </button>

          {/* Visibility toggle */}
          <button
            onClick={() => setIsPublic((p) => !p)}
            className="relative text-xs text-zinc-400 hover:text-zinc-600 transition-colors overflow-hidden"
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
            className="relative text-xs text-zinc-400 hover:text-zinc-600 underline decoration-dotted underline-offset-2 disabled:opacity-50 transition-colors overflow-hidden"
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
            className="relative text-xs text-zinc-600 hover:text-zinc-900 disabled:opacity-30 transition-colors overflow-hidden"
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
          className="w-full text-2xl font-semibold placeholder:text-zinc-300 outline-none border-none bg-transparent"
        />
        <div className="flex items-center gap-1 text-sm text-zinc-400">
          <span>essay.sh/{username}/</span>
          <input
            type="text"
            value={slug}
            onChange={handleSlugChange}
            placeholder="slug"
            className="flex-1 outline-none bg-transparent text-zinc-500 placeholder:text-zinc-300"
          />
        </div>
      </div>

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
