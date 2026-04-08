import Link from "next/link";
import { auth, signIn } from "@/auth";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { TextSelectIcon } from "@/components/icons/text-select-icon";

export default async function NotFound() {
  const session = await auth();

  return (
    <>
      <ThemeToggle />
      <main className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="max-w-sm w-full space-y-10 text-center">
          <div className="space-y-4">
            <TextSelectIcon
              size={28}
              className="mx-auto"
              color="var(--muted)"
            />
            <div className="space-y-2">
              <h1
                className="text-2xl font-semibold tracking-tight"
                style={{ color: "var(--foreground)" }}
              >
                essay.sh
              </h1>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                write in markdown, publish from the CLI, keep all your writing
                in your own git repo.
              </p>
            </div>
          </div>

          {session ? (
            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center py-4 text-sm border transition-opacity hover:opacity-70"
              style={{
                borderStyle: "dashed",
                borderColor: "var(--border)",
                color: "var(--foreground)",
                borderRadius: 0,
              }}
            >
              go to your dashboard →
            </Link>
          ) : (
            <div className="space-y-3">
              <form
                action={async () => {
                  "use server";
                  await signIn("github");
                }}
              >
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2.5 py-4 text-sm border transition-opacity hover:opacity-70"
                  style={{
                    borderStyle: "dashed",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                    borderRadius: 0,
                  }}
                >
                  <GitHubLogoIcon width={15} height={15} />
                  start writing for free
                </button>
              </form>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                this page doesn't exist. sounds like something worth writing
                about.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
