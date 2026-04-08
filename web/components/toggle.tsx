"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      {label && <span className="text-xs" style={{ color: "var(--muted)" }}>{label}</span>}
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative shrink-0"
        style={{
          width: 32,
          height: 14,
          border: "1px dashed var(--border)",
          background: "transparent",
          borderRadius: 0,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            left: checked ? "calc(100% - 9px - 2px)" : 2,
            width: 9,
            height: 9,
            background: checked ? "var(--foreground)" : "var(--border)",
            transition: "left 0.12s ease, background 0.12s ease",
          }}
        />
      </button>
    </label>
  );
}
