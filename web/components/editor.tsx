"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppMenu, AppMenuItem, AppMenuSeparator } from "@/components/app-menu";
import CodeMirror, { EditorView, keymap, Prec, type ViewUpdate } from "@uiw/react-codemirror";
import { vim, Vim } from "@replit/codemirror-vim";
import { markdown } from "@codemirror/lang-markdown";
import { uniqueNamesGenerator, adjectives, animals } from "unique-names-generator";
import { motion, AnimatePresence } from "motion/react";
import { LockClosedIcon } from "@radix-ui/react-icons";
import { Markdown } from "@/components/markdown";

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

type SlashCommand = {
  label: string;
  hint: string;
  keywords: string[];
  insert?: string;
  cursor?: number;
  action?: "image";
};

type SlashMenuState = {
  pos: number;
  query: string;
  coords: { top: number; left: number };
  activeIndex: number;
};

const SLASH_COMMANDS: SlashCommand[] = [
  { label: "Heading 1",     hint: "#",   keywords: ["h1", "heading", "title"],        insert: "# ",         cursor: 2 },
  { label: "Heading 2",     hint: "##",  keywords: ["h2", "heading"],                 insert: "## ",        cursor: 3 },
  { label: "Heading 3",     hint: "###", keywords: ["h3", "heading"],                 insert: "### ",       cursor: 4 },
  { label: "Bold",          hint: "**",  keywords: ["bold", "b", "strong"],           insert: "****",       cursor: 2 },
  { label: "Italic",        hint: "*",   keywords: ["italic", "i", "em"],             insert: "**",         cursor: 1 },
  { label: "Code block",    hint: "```", keywords: ["code", "block", "pre"],          insert: "```\n\n```", cursor: 4 },
  { label: "Quote",         hint: ">",   keywords: ["quote", "blockquote", "bq"],     insert: "> ",         cursor: 2 },
  { label: "List",          hint: "-",   keywords: ["list", "ul", "bullet"],          insert: "- ",         cursor: 2 },
  { label: "Numbered list", hint: "1.",  keywords: ["numbered", "ol", "ordered"],     insert: "1. ",        cursor: 3 },
  { label: "Divider",       hint: "---", keywords: ["divider", "hr", "rule", "line"], insert: "---\n",      cursor: 4 },
  { label: "Image",         hint: "![]", keywords: ["image", "img", "photo", "pic"],  action: "image" },
  { label: "Link",          hint: "[]",  keywords: ["link", "url", "href"],           insert: "[]()",       cursor: 1 },
];

function getFilteredCommands(query: string): SlashCommand[] {
  if (!query) return SLASH_COMMANDS;
  const q = query.toLowerCase();
  return SLASH_COMMANDS.filter(
    (cmd) => cmd.keywords.some((kw) => kw.startsWith(q)) || cmd.label.toLowerCase().includes(q)
  );
}

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
  const searchParams = useSearchParams();
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [slug, setSlug] = useState(post?.slug ?? generateSlug());
  const [slugEdited, setSlugEdited] = useState(!!post?.slug);
  const [isPublic, setIsPublic] = useState(post?.public ?? true);
  const [isPublished, setIsPublished] = useState(post?.published ?? false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [vimMode, setVimMode] = useState(false);
  const [preview, setPreview] = useState(!!post && !searchParams.has("edit"));
  const [uploading, setUploading] = useState(false);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);

  const editorViewRef = useRef<EditorView | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const slashMenuRef = useRef<SlashMenuState | null>(null);
  slashMenuRef.current = slashMenu;

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

  const togglePreview = useCallback(() => {
    const next = !preview;
    setPreview(next);
    if (post) {
      const base = `/${username}/${post.slug}`;
      router.replace(next ? base : `${base}?edit`, { scroll: false });
    }
  }, [preview, post, username, router]);

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

  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Upload failed."); return; }
      const md = `![](${data.url})`;
      const view = editorViewRef.current;
      if (view) {
        const { from } = view.state.selection.main;
        view.dispatch({ changes: { from, insert: md }, selection: { anchor: from + md.length } });
        view.focus();
      } else {
        setContent((c) => c + (c.endsWith("\n") || c === "" ? "" : "\n") + md);
      }
    } catch {
      alert("Network error during upload.");
    } finally {
      setUploading(false);
    }
  }, []);

  const applySlashCommand = useCallback((cmd: SlashCommand) => {
    const view = editorViewRef.current;
    const menu = slashMenuRef.current;
    if (!view || !menu) return;

    const { head } = view.state.selection.main;

    if (cmd.action === "image") {
      view.dispatch({ changes: { from: menu.pos, to: head, insert: "" } });
      setSlashMenu(null);
      fileInputRef.current?.click();
      return;
    }

    const insert = cmd.insert ?? "";
    const cursorOffset = cmd.cursor ?? insert.length;
    view.dispatch({
      changes: { from: menu.pos, to: head, insert },
      selection: { anchor: menu.pos + cursorOffset },
    });
    view.focus();
    setSlashMenu(null);
  }, []);

  const applySlashCommandRef = useRef(applySlashCommand);
  applySlashCommandRef.current = applySlashCommand;

  const handleUpdate = useCallback((viewUpdate: ViewUpdate) => {
    if (!viewUpdate.docChanged && !viewUpdate.selectionSet) return;
    const { head } = viewUpdate.state.selection.main;
    const line = viewUpdate.state.doc.lineAt(head);
    const textBefore = line.text.slice(0, head - line.from);
    const match = textBefore.match(/^\s*\/(\w*)$/);
    if (match) {
      const slashPos = line.from + textBefore.lastIndexOf("/");
      const query = match[1].toLowerCase();
      const filtered = getFilteredCommands(query);
      if (filtered.length === 0) { setSlashMenu(null); return; }
      const coords = viewUpdate.view.coordsAtPos(slashPos);
      if (coords) {
        setSlashMenu({ pos: slashPos, query, coords: { top: coords.bottom, left: coords.left }, activeIndex: 0 });
      }
    } else {
      setSlashMenu(null);
    }
  }, []);

  // Keyboard navigation for slash menu
  const slashKeymap = useMemo(() => Prec.highest(keymap.of([
    {
      key: "ArrowDown",
      run: () => {
        const menu = slashMenuRef.current;
        if (!menu) return false;
        const filtered = getFilteredCommands(menu.query);
        setSlashMenu({ ...menu, activeIndex: Math.min(menu.activeIndex + 1, filtered.length - 1) });
        return true;
      },
    },
    {
      key: "ArrowUp",
      run: () => {
        const menu = slashMenuRef.current;
        if (!menu) return false;
        setSlashMenu({ ...menu, activeIndex: Math.max(menu.activeIndex - 1, 0) });
        return true;
      },
    },
    {
      key: "Enter",
      run: () => {
        const menu = slashMenuRef.current;
        if (!menu) return false;
        const cmd = getFilteredCommands(menu.query)[menu.activeIndex];
        if (cmd) applySlashCommandRef.current(cmd);
        return true;
      },
    },
    {
      key: "Escape",
      run: () => {
        if (!slashMenuRef.current) return false;
        setSlashMenu(null);
        return true;
      },
    },
  ])), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    e.preventDefault();
    uploadImage(file);
  }, [uploadImage]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.items)
      .find((item) => item.type.startsWith("image/"))
      ?.getAsFile();
    if (!file) return;
    e.preventDefault();
    uploadImage(file);
  }, [uploadImage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "s") {
        e.preventDefault();
        save(e.shiftKey);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        save(true);
      }
      if (e.key === "p") {
        e.preventDefault();
        togglePreview();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save, togglePreview]);

  // Keep dropdown anchored to the slash position on scroll
  useEffect(() => {
    if (!slashMenu) return;
    const updateCoords = () => {
      const view = editorViewRef.current;
      const menu = slashMenuRef.current;
      if (!view || !menu) return;
      const coords = view.coordsAtPos(menu.pos);
      if (coords) {
        setSlashMenu((prev) => prev ? { ...prev, coords: { top: coords.bottom, left: coords.left } } : null);
      } else {
        setSlashMenu(null); // slash scrolled off-screen
      }
    };
    window.addEventListener("scroll", updateCoords, true);
    return () => window.removeEventListener("scroll", updateCoords, true);
  }, [!!slashMenu]);

  // Vim ex commands
  useEffect(() => {
    Vim.defineEx("write", "w", () => save(false));
    Vim.defineEx("wquit", "wq", () => save(false).then(() => router.push(`/${username}`)));
  }, [save, router, username]);

  const extensions = [slashKeymap, markdown(), baseTheme, EditorView.lineWrapping];
  if (vimMode) extensions.push(vim());

  const filteredCmds = slashMenu ? getFilteredCommands(slashMenu.query) : [];

  return (
    <main className="max-w-2xl mx-auto px-6 pt-12 pb-64 space-y-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImage(file);
          e.target.value = "";
        }}
      />

      <div className="flex items-center justify-between">
        <Link href={`/${username}`} className="text-xs transition-opacity hover:opacity-60" style={{ color: "var(--muted)" }}>
          ← {username}
        </Link>

        <div className="flex items-center gap-5">
          <button
            onClick={togglePreview}
            className="text-xs underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-60"
            style={{ color: "var(--muted)" }}
          >
            {preview ? "edit" : "preview"}
          </button>
          <button
            onClick={() => setIsPublic((p) => !p)}
            className="flex items-center gap-1 text-xs underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-60"
            style={{ color: "var(--muted)" }}
          >
            {!isPublic && <LockClosedIcon width={10} height={10} />}
            {isPublic ? "public" : "private"}
          </button>
          <button
            onClick={() => save(false)}
            disabled={saveState !== "idle"}
            className={`text-xs underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-60 ${saveState === "committing" ? "text-shimmer" : ""}`}
            style={saveState === "committing" ? undefined : { color: "var(--muted)" }}
          >
            commit
          </button>
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

      {preview ? (
        <>
          <div>
            <h1 className="text-2xl font-semibold leading-snug">
              {title || <span style={{ color: "var(--muted)" }}>Untitled</span>}
            </h1>
          </div>
          <Markdown content={content} />
        </>
      ) : (
        <>
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Title"
              className="editor-title w-full text-2xl font-semibold outline-none border-none bg-transparent"
              style={{ color: "var(--heading)" }}
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
            <AppMenuSeparator />
            <AppMenuItem href="/dashboard/settings">settings</AppMenuItem>
          </AppMenu>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onPaste={handlePaste}
            className="relative"
          >
            {uploading && (
              <div className="absolute inset-0 flex items-start pt-1 pointer-events-none" style={{ zIndex: 10 }}>
                <span className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-geist-mono)" }}>uploading…</span>
              </div>
            )}
            <CodeMirror
              value={content}
              onChange={setContent}
              onUpdate={handleUpdate}
              extensions={extensions}
              placeholder="Write something..."
              onCreateEditor={(view) => { editorViewRef.current = view; }}
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

            <AnimatePresence>
              {slashMenu && filteredCmds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.1 }}
                  style={{
                    position: "fixed",
                    top: slashMenu.coords.top + 6,
                    left: slashMenu.coords.left,
                    zIndex: 100,
                    border: "1px dashed var(--border)",
                    background: "var(--background)",
                    minWidth: "200px",
                    maxHeight: "220px",
                    overflowY: "auto",
                    padding: "3px 0",
                  }}
                >
                  {filteredCmds.map((cmd, i) => (
                    <button
                      key={cmd.hint}
                      ref={(el) => { if (el && i === slashMenu.activeIndex) el.scrollIntoView({ block: "nearest" }); }}
                      onMouseDown={(e) => { e.preventDefault(); applySlashCommand(cmd); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        width: "100%",
                        padding: "5px 12px",
                        background: i === slashMenu.activeIndex ? "var(--border)" : "transparent",
                        color: i === slashMenu.activeIndex ? "var(--foreground)" : "var(--muted)",
                        fontSize: "12px",
                        fontFamily: "var(--font-geist-mono)",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ opacity: 0.5, minWidth: "28px", fontSize: "11px" }}>{cmd.hint}</span>
                      <span>{cmd.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </main>
  );
}
