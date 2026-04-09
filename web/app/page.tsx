import Link from "next/link";
import { auth, signIn } from "@/auth";
import { GitHubLogoIcon, DownloadIcon } from "@radix-ui/react-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { CliPreview } from "@/components/cli-preview";
import { CopyInstall } from "@/components/copy-install";
import { TextSelectIcon } from "@/components/icons/text-select-icon";

export default async function Home() {
  const session = await auth();

  return (
    <>
    <ThemeToggle />
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-md w-full space-y-10 text-center">
        <div className="space-y-3">
          <TextSelectIcon size={28} className="mx-auto mb-2" color="var(--muted)" />
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
            essay.sh
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            A blog that lives in your git repo.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px text-xs" style={{ color: "var(--muted)" }}>
          <div className="space-y-1 pr-6 text-right" style={{ borderRight: "1px dashed var(--border)" }}>
            <p className="font-medium" style={{ color: "var(--foreground)" }}>live in minutes</p>
            <p className="leading-relaxed">connect a GitHub repo and your essays are published instantly.</p>
          </div>
          <div className="space-y-1 pl-6 text-left">
            <p className="font-medium" style={{ color: "var(--foreground)" }}>you own it all</p>
            <p className="leading-relaxed">posts are markdown files in your repo. publish from the cli or browser. no lock-in.</p>
          </div>
        </div>

        <div className="flex items-stretch gap-0 w-full">
          {session ? (
            <Link
              href="/dashboard"
              className="flex-1 inline-flex items-center justify-center py-5 text-sm font-medium border transition-opacity hover:opacity-70"
              style={{ borderStyle: "dashed", borderColor: "var(--border)", color: "var(--foreground)", borderRadius: 0 }}
            >
              go to dashboard
            </Link>
          ) : (
            <form className="flex-1" action={async () => { "use server"; await signIn("github"); }}>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-3 py-5 text-sm font-medium border transition-opacity hover:opacity-70"
                style={{ borderStyle: "dashed", borderColor: "var(--border)", color: "var(--foreground)", borderRadius: 0 }}
              >
                <GitHubLogoIcon width={16} height={16} />
                sign in
              </button>
            </form>
          )}

          <a
            href="https://github.com/timmywheels/essay/releases/latest"
            className="flex-1 inline-flex items-center justify-center gap-3 py-5 text-sm font-medium border transition-opacity hover:opacity-70"
            style={{
              borderStyle: "dashed",
              borderColor: "var(--border)",
              borderLeft: "none",
              color: "var(--foreground)",
              borderRadius: 0,
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DownloadIcon width={16} height={16} />
            download cli
          </a>
        </div>

        <div className="flex flex-col items-center gap-3">
          <CopyInstall />
          <CliPreview />
        </div>
      </div>
    </main>
    </>
  );
}

