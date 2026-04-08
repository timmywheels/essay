"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

type VerificationRecord = { type: string; domain: string; value: string };

function CopyCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <td className="py-1" style={{ wordBreak: "break-all" }}>
      <button onClick={copy} className="text-left hover:opacity-70 transition-opacity inline" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", color: "inherit" }}>
        {value}
        <span style={{ marginLeft: "0.5em", color: "var(--foreground)", opacity: copied ? 1 : 0, transition: "opacity 0.2s ease" }}>copied</span>
      </button>
    </td>
  );
}

function DnsTable({
  records,
}: {
  records: { type: string; name: string; value: string }[];
}) {
  return (
    <table
      className="w-full text-xs font-mono border-collapse"
      style={{ color: "var(--muted)" }}
    >
      <thead>
        <tr style={{ borderBottom: "1px solid var(--border)" }}>
          {["type", "name", "value"].map((h) => (
            <th
              key={h}
              className="text-left py-1 pr-4 font-normal"
              style={{ color: "var(--foreground)", whiteSpace: "nowrap" }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {records.map((r, i) => (
          <tr key={i}>
            <td className="py-1 pr-4" style={{ whiteSpace: "nowrap" }}>{r.type}</td>
            <td className="py-1 pr-4" style={{ whiteSpace: "nowrap" }}>{r.name}</td>
            <CopyCell value={r.value} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface Props {
  initialDomain: string | null;
  initialVerifiedAt: string | null;
}

export function DomainSettings({ initialDomain, initialVerifiedAt }: Props) {
  const [input, setInput] = useState(initialDomain ?? "");
  const [savedDomain, setSavedDomain] = useState<string | null>(initialDomain);
  const [verified, setVerified] = useState(!!initialVerifiedAt);
  const [status, setStatus] = useState<
    "idle" | "saving" | "removing" | "checking"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [showDns, setShowDns] = useState(false);
  const [ownershipRecords, setOwnershipRecords] = useState<
    VerificationRecord[]
  >([]);
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
    setStatus("saving");
    setError(null);
    const res = await fetch("/api/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: input.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to save");
      setStatus("idle");
      return;
    }
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
    if (!res.ok) {
      setError("Failed to remove");
      setStatus("idle");
      return;
    }
    setSavedDomain(null);
    setInput("");
    setVerified(false);
    setShowDns(false);
    setOwnershipRecords([]);
    setStatus("idle");
  }

  async function verify() {
    setStatus("checking");
    setError(null);
    const res = await fetch("/api/domains/verify", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Verification failed");
      setStatus("idle");
      return;
    }
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

  const isApex =
    savedDomain &&
    !savedDomain.startsWith("www.") &&
    savedDomain.split(".").length === 2;

  return (
    <section className="space-y-4">
      <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
        custom domain
      </p>

      <div className="space-y-3 text-sm">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="myblog.com"
            className="flex-1 px-3 py-2 text-sm bg-transparent outline-none"
            style={{
              border: "1px dashed var(--border)",
              color: "var(--foreground)",
              borderRadius: 0,
              minWidth: 0,
            }}
          />
          <button
            onClick={save}
            disabled={
              status !== "idle" || !input.trim() || input.trim() === savedDomain
            }
            className="text-sm px-4 py-2 transition-opacity hover:opacity-70 disabled:opacity-40 shrink-0"
            style={{
              border: "1px dashed var(--border)",
              color: "var(--foreground)",
              borderRadius: 0,
            }}
          >
            {status === "saving" ? "…" : "save"}
          </button>
        </div>

        {error && (
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {error}
          </p>
        )}

        {savedDomain && (
          <div className="space-y-3 text-xs" style={{ color: "var(--muted)" }}>
            <div className="flex items-center gap-3">
              <span
                style={{
                  color: verified ? "var(--foreground)" : "var(--muted)",
                }}
              >
                {verified ? "verified" : "pending"}
              </span>
              {!verified && (
                <button
                  onClick={verify}
                  disabled={status === "checking"}
                  className="underline decoration-dotted underline-offset-2 hover:opacity-70"
                >
                  {status === "checking" ? "…" : "check"}
                </button>
              )}
              <button
                onClick={remove}
                disabled={status !== "idle"}
                className="underline decoration-dotted underline-offset-2 hover:opacity-70 ml-auto"
              >
                {status === "removing" ? "…" : "remove"}
              </button>
            </div>

            {ownershipRecords.length > 0 && (
              <div className="space-y-2 pt-1">
                <p style={{ color: "var(--foreground)" }}>
                  ownership verification required
                </p>
                <p>add these dns records, then click check:</p>
                <DnsTable
                  records={[
                    ...ownershipRecords.map((r) => ({
                      type: r.type,
                      name: r.domain,
                      value: r.value,
                    })),
                    ...(isApex
                      ? [
                          {
                            type: "A",
                            name: "@",
                            value: aValues[0] ?? "76.76.21.21",
                          },
                          {
                            type: "CNAME",
                            name: "www",
                            value: cnames[0] ?? "cname.vercel-dns.com",
                          },
                        ]
                      : [
                          {
                            type: "CNAME",
                            name: savedDomain!.split(".")[0],
                            value: cnames[0] ?? "cname.vercel-dns.com",
                          },
                        ]),
                  ]}
                />
              </div>
            )}

            {ownershipRecords.length === 0 && (
              <>
                <button
                  onClick={() => setShowDns((s) => !s)}
                  className="underline decoration-dotted underline-offset-2 hover:opacity-70"
                >
                  {showDns ? "hide" : "show"} dns config
                </button>

                <AnimatePresence>
                  {showDns && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <DnsTable
                        records={
                          isApex
                            ? [
                                {
                                  type: "A",
                                  name: "@",
                                  value: aValues[0] ?? "76.76.21.21",
                                },
                                {
                                  type: "CNAME",
                                  name: "www",
                                  value: cnames[0] ?? "cname.vercel-dns.com",
                                },
                              ]
                            : [
                                {
                                  type: "CNAME",
                                  name: savedDomain!.split(".")[0],
                                  value: cnames[0] ?? "cname.vercel-dns.com",
                                },
                              ]
                        }
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
