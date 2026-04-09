"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import { SunIcon, MoonIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  children?: React.ReactNode;
}

export function AppMenu({ children }: Props) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && (
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

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
            style={{ border: "1px dashed var(--border)", background: "var(--background)", marginTop: "8px", minWidth: "160px" }}
          >
            <div style={{ padding: "6px 0" }}>
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex items-center justify-between w-full text-xs px-4 py-2.5 transition-opacity hover:opacity-60"
                style={{ color: "var(--muted)" }}
              >
                <span>{isDark ? "light mode" : "dark mode"}</span>
                {mounted && (isDark ? <SunIcon width={13} height={13} /> : <MoonIcon width={13} height={13} />)}
              </button>

              {children && (
                <>
                  <div style={{ height: "1px", borderTop: "1px dashed var(--border)", margin: "4px 0" }} />
                  {children}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {open && <div className="fixed inset-0" style={{ zIndex: -1 }} onClick={() => setOpen(false)} />}
    </div>
  );
}

export function AppMenuItem({ onClick, href, children, indicator }: {
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  indicator?: boolean;
}) {
  const className = "flex items-center justify-between w-full text-xs px-4 py-2.5 transition-opacity hover:opacity-60";
  const style = { color: "var(--muted)" as const };
  const content = (
    <>
      <span>{children}</span>
      {indicator !== undefined && (
        <AnimatePresence>
          {indicator && (
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
      )}
    </>
  );

  if (href) {
    return <Link href={href} className={className} style={style}>{content}</Link>;
  }
  return <button onClick={onClick} className={className} style={style}>{content}</button>;
}
