import Link from "next/link";
import { auth, signIn } from "@/auth";
import { CrumpledPaperIcon, GitHubLogoIcon } from "@radix-ui/react-icons";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-md w-full space-y-10 text-center">
        <div className="space-y-3">
          <CrumpledPaperIcon className="mx-auto mb-2" width={28} height={28} style={{ color: "var(--muted)" }} />
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
            essay.sh
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Commit your thoughts to source.
          </p>
        </div>

        <div className="flex flex-col items-center gap-5">
          {session ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-16 py-5 text-sm font-medium border transition-colors"
              style={{
                borderStyle: "dashed",
                borderColor: "var(--border)",
                color: "var(--foreground)",
                borderRadius: 0,
              }}
            >
              go to dashboard
            </Link>
          ) : (
            <form action={async () => { "use server"; await signIn("github"); }}>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-3 px-16 py-5 text-sm font-medium border transition-opacity hover:opacity-70"
                style={{
                  borderStyle: "dashed",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                  borderRadius: 0,
                }}
              >
                <GitHubLogoIcon width={16} height={16} />
                sign in with github
              </button>
            </form>
          )}

          <a
            href="https://github.com/timmywheels/essay/releases/latest"
            className="text-xs transition-colors"
            style={{
              color: "var(--muted)",
              textDecoration: "underline",
              textDecorationStyle: "dotted",
              textUnderlineOffset: "3px",
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            download cli
          </a>
        </div>
      </div>
    </main>
  );
}

