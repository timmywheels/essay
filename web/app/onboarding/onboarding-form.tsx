"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingForm({ suggestion }: { suggestion: string }) {
  const router = useRouter();
  const [username, setUsername] = useState(suggestion);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm w-full space-y-8">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
            Choose your username
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Your posts will live at essay.sh/username
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-stretch border" style={{ borderColor: "var(--border)", borderRadius: 0 }}>
            <span
              className="px-3 text-sm flex items-center select-none border-r"
              style={{ color: "var(--muted)", borderColor: "var(--border)", borderRight: "1px dashed var(--border)" }}
            >
              essay.sh/
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="yourname"
              required
              minLength={2}
              maxLength={30}
              className="flex-1 px-3 py-3 text-sm outline-none bg-transparent"
              style={{ color: "var(--foreground)" }}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || username.length < 2}
            className="w-full py-3 text-sm font-medium border transition-opacity hover:opacity-70 disabled:opacity-30"
            style={{
              borderStyle: "dashed",
              borderColor: "var(--border)",
              color: "var(--foreground)",
              borderRadius: 0,
              background: "transparent",
            }}
          >
            {loading ? "saving..." : "continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
