"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { SunIcon, MoonIcon, ChevronRightIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "motion/react";

// ─── Menu item types ────────────────────────────────────────────────────────

type MenuItem =
  | { kind: "action"; label: string; icon?: React.ReactNode; onSelect: () => void }
  | { kind: "panel";  label: string; icon?: React.ReactNode; panel: string };

// ─── Subpanels ───────────────────────────────────────────────────────────────

type VerificationRecord = { type: string; domain: string; value: string };

function DnsTable({ records }: { records: { type: string; name: string; value: string }[] }) {
  return (
    <table className="w-full text-xs font-mono border-collapse" style={{ color: "var(--muted)" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid var(--border)" }}>
          {["type", "name", "value"].map((h) => (
            <th key={h} className="text-left py-1 pr-4 font-normal" style={{ color: "var(--foreground)", whiteSpace: "nowrap" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {records.map((r, i) => (
          <tr key={i}>
            <td className="py-1 pr-4" style={{ whiteSpace: "nowrap" }}>{r.type}</td>
            <td className="py-1 pr-4" style={{ whiteSpace: "nowrap" }}>{r.name}</td>
            <td className="py-1" style={{ wordBreak: "break-all" }}>{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DomainPanel({ onBack, initialDomain, initialVerifiedAt }: { onBack: () => void; initialDomain: string | null; initialVerifiedAt: string | null }) {
  const [input, setInput] = useState(initialDomain ?? "");
  const [savedDomain, setSavedDomain] = useState<string | null>(initialDomain);
  const [verified, setVerified] = useState(!!initialVerifiedAt);
  const [status, setStatus] = useState<"idle" | "saving" | "removing" | "checking">("idle");
  const [error, setError] = useState<string | null>(null);
  const [showDns, setShowDns] = useState(false);
  const [ownershipRecords, setOwnershipRecords] = useState<VerificationRecord[]>([]);
  const [cnames, setCnames] = useState<string[]>([]);
  const [aValues, setAValues] = useState<string[]>([]);

  useEffect(() => {
    if (!initialDomain) return;
    fetch("/api/domains/verify", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        setOwnershipRecords(data.verification ?? []);
        setCnames(data.cnames ?? []);
        setAValues(data.aValues ?? []);
      });
  }, [initialDomain]);

  async function save() {
    if (!input.trim()) return;
    setStatus("saving"); setError(null);
    const res = await fetch("/api/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: input.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to save"); setStatus("idle"); return; }
    setSavedDomain(data.domain);
    setVerified(data.verified ?? false);
    setOwnershipRecords(data.verification ?? []);
    setCnames(data.cnames ?? []);
    setAValues(data.aValues ?? []);
    setShowDns(true);
    setStatus("idle");
  }

  async function remove() {
    setStatus("removing");
    const res = await fetch("/api/domains", { method: "DELETE" });
    if (!res.ok) { setError("Failed to remove"); setStatus("idle"); return; }
    setSavedDomain(null); setInput(""); setVerified(false); setShowDns(false); setOwnershipRecords([]);
    setStatus("idle");
  }

  async function verify() {
    setStatus("checking"); setError(null);
    const res = await fetch("/api/domains/verify", { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Verification failed"); setStatus("idle"); return; }
    setCnames(data.cnames ?? []);
    setAValues(data.aValues ?? []);
    if (data.verified) {
      setVerified(true);
      setOwnershipRecords([]);
    } else {
      setOwnershipRecords(data.verification ?? []);
      setError("Not yet verified — DNS can take up to 48h.");
    }
    setStatus("idle");
  }

  const isApex = savedDomain && !savedDomain.startsWith("www.") && savedDomain.split(".").length === 2;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-60" style={{ color: "var(--muted)" }}>
        <ArrowLeftIcon width={11} height={11} />
        <span>custom domain</span>
      </button>

      <div style={{ height: "1px", background: "var(--border)" }} />

      <div className="space-y-3">
        <div className="flex gap-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="myblog.com"
            className="flex-1 text-xs px-2 py-1 bg-transparent outline-none"
            style={{ border: "1px dashed var(--border)", color: "var(--foreground)", borderRadius: 0, minWidth: 0 }}
            autoFocus
          />
          <button
            onClick={save}
            disabled={status !== "idle" || !input.trim() || input.trim() === savedDomain}
            className="text-xs px-2 py-1 transition-opacity hover:opacity-70 disabled:opacity-40 shrink-0"
            style={{ border: "1px dashed var(--border)", color: "var(--foreground)", borderRadius: 0 }}
          >
            {status === "saving" ? "…" : "save"}
          </button>
        </div>

        {error && <p className="text-xs" style={{ color: "var(--muted)" }}>{error}</p>}

        {savedDomain && (
          <div className="space-y-2 text-xs" style={{ color: "var(--muted)" }}>
            <div className="flex items-center gap-2">
              <span style={{ color: verified ? "var(--foreground)" : "var(--muted)" }}>
                {verified ? "verified" : "pending"}
              </span>
              {!verified && (
                <button onClick={verify} disabled={status === "checking"} className="underline decoration-dotted underline-offset-2 hover:opacity-70">
                  {status === "checking" ? "…" : "check"}
                </button>
              )}
              <button onClick={remove} disabled={status !== "idle"} className="underline decoration-dotted underline-offset-2 hover:opacity-70 ml-auto">
                {status === "removing" ? "…" : "remove"}
              </button>
            </div>

            {ownershipRecords.length > 0 && (
              <div className="space-y-2 pt-1">
                <p style={{ color: "var(--foreground)" }}>ownership verification required</p>
                <p>add this record, then click check:</p>
                <DnsTable records={ownershipRecords.map((r) => ({ type: r.type, name: r.domain, value: r.value }))} />
              </div>
            )}

            <button onClick={() => setShowDns((s) => !s)} className="underline decoration-dotted underline-offset-2 hover:opacity-70">
              {showDns ? "hide" : "show"} dns config
            </button>

            <AnimatePresence>
              {showDns && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <DnsTable records={isApex
                    ? [
                        ...aValues.map((v) => ({ type: "A",     name: "@",   value: v })),
                        ...cnames.map((v) => ({ type: "CNAME", name: "www", value: v })),
                      ].filter((r) => r.value)
                    : cnames.map((v) => ({ type: "CNAME", name: savedDomain!.split(".")[0], value: v }))
                      .filter((r) => r.value)
                  } />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Panel registry ──────────────────────────────────────────────────────────

type PanelProps = { onBack: () => void; initialDomain: string | null; initialVerifiedAt: string | null };

const PANELS: Record<string, (props: PanelProps) => React.ReactNode> = {
  domain: (props) => <DomainPanel {...props} />,
};

// ─── Main menu ───────────────────────────────────────────────────────────────

interface Props {
  initialDomain: string | null;
  initialVerifiedAt: string | null;
}

export function ProfileMenu({ initialDomain, initialVerifiedAt }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && (
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  function close() {
    setOpen(false);
    setTimeout(() => setPanel(null), 200);
  }

  const items: MenuItem[] = [
    {
      kind: "action",
      label: isDark ? "light mode" : "dark mode",
      icon: mounted ? (isDark ? <SunIcon width={13} height={13} /> : <MoonIcon width={13} height={13} />) : null,
      onSelect: () => setTheme(isDark ? "light" : "dark"),
    },
    {
      kind: "panel",
      label: "custom domain",
      icon: <ChevronRightIcon width={13} height={13} />,
      panel: "domain",
    },
    {
      kind: "action",
      label: "sign out",
      onSelect: () => fetch("/api/auth/signout", { method: "POST" }).then(() => (window.location.href = "/")),
    },
  ];

  return (
    <div className="fixed top-4 right-10 flex flex-col items-end" style={{ zIndex: 50 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs transition-opacity hover:opacity-60"
        style={{ color: "var(--muted)", letterSpacing: "0.1em" }}
      >
        ···
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{ border: "1px dashed var(--border)", background: "var(--background)", marginTop: "8px", overflow: "hidden" }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {panel ? (
                <motion.div key={panel} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.12 }} style={{ padding: "14px 16px" }}>
                  {PANELS[panel]?.({ onBack: () => setPanel(null), initialDomain, initialVerifiedAt })}
                </motion.div>
              ) : (
                <motion.div key="main" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.12 }} style={{ padding: "6px 0" }}>
                  {items.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => item.kind === "panel" ? setPanel(item.panel) : item.onSelect()}
                      className="flex items-center justify-between w-full text-xs px-4 py-2.5 transition-opacity hover:opacity-60"
                      style={{ color: "var(--muted)" }}
                    >
                      <span>{item.label}</span>
                      {item.icon && <span className="shrink-0">{item.icon}</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {open && <div className="fixed inset-0" style={{ zIndex: -1 }} onClick={close} />}
    </div>
  );
}
