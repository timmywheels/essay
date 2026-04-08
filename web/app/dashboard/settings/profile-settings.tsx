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

interface Props {
  initialName: string;
  initialBio: string;
  initialLinks: LinkItem[];
  initialProfilePublic: boolean;
  initialShowUsername: boolean;
  username: string;
}

export function ProfileSettings({ initialName, initialBio, initialLinks, initialProfilePublic, initialShowUsername, username }: Props) {
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [links, setLinks] = useState<LinkItem[]>(initialLinks.length ? initialLinks : []);
  const [profilePublic, setProfilePublic] = useState(initialProfilePublic);
  const [showUsername, setShowUsername] = useState(initialShowUsername);
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
      </div>
    </section>
  );
}
