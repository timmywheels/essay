"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

const WEEKS = 52;
const W = 1000;
const H = 80;
const FLOOR = H - 10;
const CEIL = 8;
const PAD = 90; // inset so edge data points land inside the mask's opaque zone (mask fades 0-8%)

interface Props {
  publishedDates: Date[];
  username: string;
  posts?: Record<string, { title: string; slug: string }>;
  interactive?: boolean;
}

interface WeekData {
  count: number;
  startDate: Date;
  postLinks: { title: string; slug: string }[];
}

function MorePopover({ posts, username }: { posts: { title: string; slug: string }[]; username: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative" }}>
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{ fontSize: "11px", color: "var(--muted)" }}
      >
        +{posts.length} more
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            style={{
              position: "absolute",
              bottom: "calc(100% + 6px)",
              left: 0,
              border: "1px dashed var(--border)",
              background: "var(--background)",
              padding: "6px 0",
              minWidth: "160px",
              zIndex: 50,
            }}
          >
            {posts.map((p, i) => (
              <Link
                key={i}
                href={`/${username}/${p.slug}`}
                style={{ display: "block", padding: "6px 16px", fontSize: "11px", color: "var(--foreground)", textDecoration: "none" }}
                className="hover:opacity-60 transition-opacity"
              >
                {p.title}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

function spline(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

export function ActivityCalendar({ publishedDates, username, posts = {}, interactive = true }: Props) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  const start = new Date(sunday);
  start.setDate(sunday.getDate() - 51 * 7);

  const weeks: WeekData[] = Array.from({ length: WEEKS }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i * 7);
    return { count: 0, startDate: d, postLinks: [] };
  });

  for (const d of publishedDates) {
    const wi = Math.floor((d.getTime() - start.getTime()) / 864e5 / 7);
    if (wi >= 0 && wi < WEEKS) {
      weeks[wi].count++;
      const key = d.toISOString().split("T")[0];
      if (posts[key]) weeks[wi].postLinks.push(posts[key]);
    }
  }

  const maxCount = Math.max(...weeks.map((w) => w.count), 1);

  // Organic baseline: subtle sine wobble even at 0, rises with activity
  const wavePoints = weeks.map((week, i) => {
    const t = i / (WEEKS - 1);
    const baseWobble = Math.sin(i * 0.45) * 3 + Math.sin(i * 0.9 + 1.2) * 1.5;
    const activity = (week.count / maxCount) * (FLOOR - CEIL);
    return { x: PAD + t * (W - 2 * PAD), y: FLOOR - baseWobble - activity };
  });

  // Extend the spline to the container edges with phantom points so the fade
  // has something to fade — the actual data points stay inset and hoverable.
  const extendedPoints = [
    { x: 0, y: wavePoints[0].y },
    ...wavePoints,
    { x: W, y: wavePoints[WEEKS - 1].y },
  ];
  const linePath = spline(extendedPoints);
  const areaPath = `${linePath} L ${W},${H} L 0,${H} Z`;

  const cursorX = hoveredWeek !== null ? wavePoints[hoveredWeek].x : null;
  const cursorY = hoveredWeek !== null ? wavePoints[hoveredWeek].y : null;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rel = (e.clientX - rect.left) / rect.width;
    // Map from padded range [PAD/W .. (W-PAD)/W] → [0 .. WEEKS-1]
    const adjustedRel = (rel - PAD / W) / (1 - (2 * PAD) / W);
    setHoveredWeek(Math.max(0, Math.min(WEEKS - 1, Math.round(adjustedRel * (WEEKS - 1)))));
  }

  function handleClick() {
    if (hoveredWeek === null) return;
    const slug = weeks[hoveredWeek].postLinks[0]?.slug;
    if (!slug) return;
    const el = document.getElementById(`post-${slug}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    window.dispatchEvent(new CustomEvent("post-highlight", { detail: { slug } }));
  }

  return (
    <div>
      <div style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)", opacity: 0.75 }}>
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMinYMid meet"
        style={{ display: "block", overflow: "visible", cursor: interactive ? (hoveredWeek !== null && weeks[hoveredWeek]?.postLinks.length > 0 ? "pointer" : "crosshair") : "default" }}
        onMouseMove={interactive ? handleMouseMove : undefined}
        onClick={interactive ? handleClick : undefined}
      >
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.1} />
            <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Filled area */}
        <path d={areaPath} fill={`url(#${id}-g)`} />

        {/* Wave line — draws in left to right */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth={1.5}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.75 }}
          transition={{
            pathLength: { duration: 2.2, ease: "easeInOut" },
            opacity: { duration: 0.4 },
          }}
        />

        {/* Hover cursor */}
        {cursorX !== null && cursorY !== null && (
          <>
            <motion.line
              x1={cursorX} y1={0} x2={cursorX} y2={H}
              stroke="var(--foreground)"
              strokeWidth={1}
              strokeDasharray="3 4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              transition={{ duration: 0.1 }}
            />
            <motion.circle
              cx={cursorX}
              cy={cursorY}
              r={4}
              fill="var(--background)"
              stroke="var(--foreground)"
              strokeWidth={1.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              style={{ transformOrigin: `${cursorX}px ${cursorY}px` }}
            />
          </>
        )}
      </svg>
      </div>

      <div style={{ height: interactive ? "20px" : 0, marginTop: interactive ? "8px" : 0, overflow: interactive ? "visible" : "hidden" }}>
        <AnimatePresence mode="wait">
          {hoveredWeek !== null && (
            <motion.div
              key={hoveredWeek}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              style={{ display: "flex", alignItems: "baseline", gap: "10px" }}
            >
              <span style={{ fontSize: "11px", color: "var(--muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {weeks[hoveredWeek].startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              {weeks[hoveredWeek].postLinks.slice(0, 2).map((p, i) => (
                <a
                  key={i}
                  href={`/${username}/${p.slug}`}
                  style={{
                    fontSize: "11px",
                    color: "var(--foreground)",
                    textDecoration: "underline",
                    textDecorationStyle: "dotted",
                    textUnderlineOffset: "3px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.title}
                </a>
              ))}
              {weeks[hoveredWeek].postLinks.length > 2 && (
                <MorePopover
                  posts={weeks[hoveredWeek].postLinks.slice(2)}
                  username={username}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
