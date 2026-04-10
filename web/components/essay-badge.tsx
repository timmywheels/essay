import Link from "next/link";
import { TextSelectIcon } from "@/components/icons/text-select-icon";

export function EssayBadge({ username }: { username: string }) {
  return (
    <Link
      href={`https://essay.sh?ref=${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-0 right-0 flex items-center gap-2 px-5 text-xs transition-opacity hover:opacity-70"
      style={{ height: "52px", borderTop: "1px dashed var(--border)", borderLeft: "1px dashed var(--border)", color: "var(--muted)", background: "var(--background)" }}
    >
      <TextSelectIcon size={14} color="var(--muted)" />
      essay.sh
    </Link>
  );
}
