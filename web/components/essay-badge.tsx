import Link from "next/link";
import { TextSelectIcon } from "@/components/icons/text-select-icon";

export function EssayBadge({ username }: { username: string }) {
  return (
    <Link
      href={`https://essay.sh?ref=${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-opacity hover:opacity-70"
      style={{ border: "1px dashed var(--border)", color: "var(--muted)", background: "var(--background)" }}
    >
      <TextSelectIcon size={14} color="var(--muted)" />
      essay.sh
    </Link>
  );
}
