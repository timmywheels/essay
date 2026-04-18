"use client";

import { useState } from "react";
import { Toggle } from "@/components/toggle";

type LinkItem = { label: string; url: string };

function defaultLabel(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const path = pathname.replace(/\/$/, "");
    return (hostname + path).replace(/^www\./, "");
  } catch {
    return url;
  }
}

const THEMES = [
  { value: "default", label: "Default" },
  { value: "gr",      label: "GR" },
  { value: "pg",      label: "PG" },
];

interface Props {
  initialName: string;
  initialBio: string;
  initialLinks: LinkItem[];
  initialProfilePublic: boolean;
  initialShowUsername: boolean;
  initialShowActivityGraph: boolean;
  initialShowRevisionHistory: boolean;
  initialTheme: string;
  initialAnalyticsId: string;
  username: string;
}

export function ProfileSettings({ initialName, initialBio, initialLinks, initialProfilePublic, initialShowUsername, initialShowActivityGraph, initialShowRevisionHistory, initialTheme, initialAnalyticsId, username }: Props) {
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [links, setLinks] = useState<LinkItem[]>(initialLinks.length ? initialLinks : []);
  const [analyticsId, setAnalyticsId] = useState(initialAnalyticsId);
  const [profilePublic, setProfilePublic] = useState(initialProfilePublic);
  const [showUsername, setShowUsername] = useState(initialShowUsername);
  const [showActivityGraph, setShowActivityGraph] = useState(initialShowActivityGraph);
  const [showRevisionHistory, setShowRevisionHistory] = useState(initialShowRevisionHistory);
  const [theme, setTheme] = useState(initialTheme);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function save() {
    setStatus("saving");
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() || null,
        bio: bio.trim() || null,
        links: links
          .filter((l) => l.url.trim())
          .map((l) => ({ url: l.url.trim(), label: l.label.trim() || defaultLabel(l.url.trim()) })),
      }),
    });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  }

  function updateLink(i: number, field: keyof LinkItem, value: string) {
    setLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  }

  async function patch(data: Record<string, unknown>) {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  return (
    <section className="space-y-8">
      <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>profile</p>

      {/* Display name + links */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs" style={{ color: "var(--muted)" }}>display name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={username}
            className="w-full px-3 py-2 text-sm bg-transparent outline-none"
            style={{ border: "1px dashed var(--border)", color: "var(--foreground)", borderRadius: 0 }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs" style={{ color: "var(--muted)" }}>bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="a few words about you"
            maxLength={280}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-transparent outline-none resize-none"
            style={{ border: "1px dashed var(--border)", color: "var(--foreground)", borderRadius: 0 }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs" style={{ color: "var(--muted)" }}>links <span style={{ opacity: 0.5 }}>({links.length}/5)</span></label>
          <div className="space-y-2">
            {links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink(i, "label", e.target.value)}
                  placeholder="label"
                  className="w-28 px-3 py-2 text-sm bg-transparent outline-none shrink-0"
                  style={{ border: "1px dashed var(--border)", color: "var(--foreground)", borderRadius: 0 }}
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(i, "url", e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 text-sm bg-transparent outline-none min-w-0"
                  style={{ border: "1px dashed var(--border)", color: "var(--foreground)", borderRadius: 0 }}
                />
                <button
                  onClick={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))}
                  className="px-3 text-sm transition-opacity hover:opacity-60 shrink-0"
                  style={{ color: "var(--muted)" }}
                >
                  ×
                </button>
              </div>
            ))}
            {links.length < 5 && (
              <button
                onClick={() => setLinks((prev) => [...prev, { label: "", url: "" }])}
                className="text-xs underline decoration-dotted underline-offset-2 hover:opacity-70"
                style={{ color: "var(--muted)" }}
              >
                + add link
              </button>
            )}
          </div>
        </div>

        <button
          onClick={save}
          disabled={status === "saving"}
          className="text-xs px-4 py-2 transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{ border: "1px dashed var(--border)", color: "var(--foreground)", borderRadius: 0 }}
        >
          {status === "saving" ? "saving…" : status === "saved" ? "saved" : "save"}
        </button>
      </div>

      {/* Privacy toggles */}
      <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "1.5rem" }} className="space-y-5">
        <div className="space-y-1">
          <Toggle
            checked={profilePublic}
            onChange={(val) => { setProfilePublic(val); patch({ profilePublic: val }); }}
            label="public profile"
          />
          <p className="text-xs pl-0" style={{ color: "var(--muted)", opacity: 0.6 }}>
            {profilePublic ? "your profile and posts are visible to everyone." : "your profile is hidden — only you can see it."}
          </p>
        </div>

        <div className="space-y-1">
          <Toggle
            checked={showUsername}
            onChange={(val) => { setShowUsername(val); patch({ showUsername: val }); }}
            label="show username"
          />
          <p className="text-xs" style={{ color: "var(--muted)", opacity: 0.6 }}>
            {showUsername ? `@${username} is shown beneath your display name.` : "only your display name is shown on your profile."}
          </p>
        </div>

        <div className="space-y-1">
          <Toggle
            checked={showActivityGraph}
            onChange={(val) => { setShowActivityGraph(val); patch({ showActivityGraph: val }); }}
            label="show activity graph"
          />
          <p className="text-xs" style={{ color: "var(--muted)", opacity: 0.6 }}>
            {showActivityGraph ? "publishing history is shown on your profile." : "activity graph is hidden from your profile."}
          </p>
        </div>

        <div className="space-y-1">
          <Toggle
            checked={showRevisionHistory}
            onChange={(val) => { setShowRevisionHistory(val); patch({ showRevisionHistory: val }); }}
            label="show revision history"
          />
          <p className="text-xs" style={{ color: "var(--muted)", opacity: 0.6 }}>
            {showRevisionHistory ? "readers see the number of revisions on each post, linking to github." : "revision history is hidden from readers."}
            {theme !== "default" && <span style={{ opacity: 0.7 }}> only shown on the default theme.</span>}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs" style={{ color: "var(--foreground)" }}>theme</p>
          <div className="flex gap-3">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => { setTheme(t.value); patch({ theme: t.value }); }}
                className="text-xs px-3 py-1.5 transition-opacity hover:opacity-70"
                style={{
                  border: "1px dashed var(--border)",
                  borderRadius: 0,
                  color: theme === t.value ? "var(--foreground)" : "var(--muted)",
                  opacity: theme === t.value ? 1 : 0.6,
                  fontWeight: theme === t.value ? 500 : 400,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--muted)", opacity: 0.6 }}>
            {theme === "pg"
              ? "paul graham mode — verdana, classic blue links, faded watermark."
              : theme === "gr"
              ? <>inspired by <a href="https://x.com/rauchg" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2">@rauchg</a>'s blog — clean, minimal, typographic.</>
              : "the default look — clean and spacious, inspired by the essay.sh aesthetic."}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs" style={{ color: "var(--foreground)" }}>analytics</p>
          <input
            type="text"
            value={analyticsId}
            onChange={(e) => setAnalyticsId(e.target.value)}
            placeholder="G-XXXXXXXXXX"
            className="w-full px-3 py-2 text-sm bg-transparent outline-none font-mono"
            style={{ border: "1px dashed var(--border)", color: "var(--foreground)", borderRadius: 0 }}
            onBlur={() => patch({ analyticsId: analyticsId.trim() || null })}
          />
          <p className="text-xs" style={{ color: "var(--muted)", opacity: 0.6 }}>
            google analytics 4 measurement id. injected on your profile and post pages only.
          </p>
        </div>
      </div>
    </section>
  );
}
