import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ProfileSettings } from "./profile-settings";
import { DomainSettings } from "./domain-settings";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      username: true,
      settings: true,
    },
  });

  if (!user) redirect("/");

  const s = user.settings;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-12">
      <div>
        <Link href={`/${user.username}`} className="text-xs transition-opacity hover:opacity-60 block mb-6" style={{ color: "var(--muted)" }}>← back</Link>
        <h1 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>settings</h1>
      </div>

      <ProfileSettings
        initialName={user.name ?? ""}
        initialBio={s?.bio ?? ""}
        initialLinks={(s?.links as { label: string; url: string }[]) ?? []}
        initialProfilePublic={s?.profilePublic ?? true}
        initialShowUsername={s?.showUsername ?? true}
        initialShowActivityGraph={s?.showActivityGraph ?? true}
        initialTheme={s?.theme ?? "default"}
        initialAnalyticsId={s?.analyticsId ?? ""}
        username={user.username ?? ""}
      />

      <DomainSettings
        initialDomain={s?.customDomain ?? null}
        initialVerifiedAt={s?.domainVerifiedAt?.toISOString() ?? null}
      />

      {/* Account — always at the bottom */}
      <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "1.5rem" }}>
        <form action={async () => { "use server"; const { signOut } = await import("@/auth"); await signOut({ redirectTo: "/" }); }}>
          <button type="submit" className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--muted)" }}>
            sign out
          </button>
        </form>
      </div>
    </main>
  );
}
