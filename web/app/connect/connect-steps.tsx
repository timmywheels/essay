"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  installUrl: string;
  newRepoUrl: string;
};

export default function ConnectSteps({ installUrl, newRepoUrl }: Props) {
  const [repoCreated, setRepoCreated] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm w-full space-y-8">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Connect a repo</h1>
          <p className="text-sm text-zinc-500">
            Your posts will be stored as markdown files in a GitHub repo you own.
          </p>
        </div>

        <ol className="space-y-6">
          {/* Step 1 */}
          <li className="flex gap-4">
            <motion.span
              animate={{ color: repoCreated ? "#52525b" : "#d4d4d8" }}
              transition={{ duration: 0.3 }}
              className="text-xs mt-0.5 shrink-0 w-3 text-center"
            >
              {repoCreated ? "✓" : "1"}
            </motion.span>
            <div className="space-y-1 min-w-0">
              <motion.p
                animate={{ color: repoCreated ? "#a1a1aa" : "#18181b" }}
                transition={{ duration: 0.3 }}
                className="text-sm"
              >
                Create a repo on GitHub
              </motion.p>
              <AnimatePresence initial={false}>
                {!repoCreated && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1 overflow-hidden"
                  >
                    <p className="text-xs text-zinc-400">
                      We suggest naming it <code className="font-mono">essays</code>.
                    </p>
                    <a
                      href={newRepoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setRepoCreated(true)}
                      className="text-xs underline decoration-dotted underline-offset-2 text-zinc-500 hover:text-zinc-700 transition-colors"
                    >
                      Create on GitHub →
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </li>

          {/* Step 2 */}
          <li className="flex gap-4">
            <motion.span
              animate={{ color: repoCreated ? "#d4d4d8" : "#e4e4e7" }}
              transition={{ duration: 0.3 }}
              className="text-xs mt-0.5 shrink-0 w-3 text-center"
            >
              2
            </motion.span>
            <motion.div
              animate={{ opacity: repoCreated ? 1 : 0.35 }}
              transition={{ duration: 0.3 }}
              className="space-y-1"
            >
              <p className="text-sm">Install the app and select that repo</p>
              <p className="text-xs text-zinc-400">
                Only grant access to the one repo — nothing else.
              </p>
              <a
                href={repoCreated ? installUrl : undefined}
                onClick={(e) => { if (!repoCreated) e.preventDefault(); }}
                className={`text-xs underline decoration-dotted underline-offset-2 transition-colors ${
                  repoCreated ? "text-zinc-500 hover:text-zinc-700 cursor-pointer" : "text-zinc-300 cursor-default"
                }`}
              >
                Install app →
              </a>
            </motion.div>
          </li>
        </ol>

        <Link href="/dashboard" className="block text-xs text-zinc-300 hover:text-zinc-500 transition-colors">
          ← back
        </Link>
      </div>
    </main>
  );
}
