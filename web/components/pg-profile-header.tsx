interface Props {
  bio?: string | null;
  isOwner: boolean;
}

export function PgProfileHeader({ bio, isOwner }: Props) {
  return (
    <header className="space-y-2">
      <h1 className="text-xl font-semibold">Essays</h1>
      {bio && <p className="text-sm" style={{ color: "var(--muted)" }}>{bio}</p>}
    </header>
  );
}
