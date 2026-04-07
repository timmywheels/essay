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
      <div className="max-w-sm w-full space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Choose your username</h1>
          <p className="text-sm text-zinc-500">
            Your posts will live at essay.sh/username
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center border border-zinc-200 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-zinc-900">
            <span className="px-3 text-sm text-zinc-400 select-none border-r border-zinc-200 py-2">
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
              className="flex-1 px-3 py-2 text-sm outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || username.length < 2}
            className="w-full h-9 rounded-md bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
