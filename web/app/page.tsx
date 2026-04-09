import Link from "next/link";
import { auth, signIn } from "@/auth";
import { GitHubLogoIcon, DownloadIcon } from "@radix-ui/react-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { CopyInstall } from "@/components/copy-install";
import { TextSelectIcon } from "@/components/icons/text-select-icon";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen" style={{ color: "var(--foreground)" }}>
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50" style={{ borderBottom: "1px dashed var(--border)", background: "var(--background)" }}>
        <div className="max-w-4xl mx-auto px-6 flex items-stretch justify-between" style={{ height: "52px" }}>
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
            <TextSelectIcon size={16} color="var(--foreground)" />
            <span className="text-sm font-medium">essay.sh</span>
          </Link>
          <div className="flex items-stretch">
            {/* vertical divider */}
            <div className="self-stretch" style={{ width: "1px", borderRight: "1px dashed var(--border)" }} />
            {session ? (
              <Link
                href="/dashboard"
                className="flex items-center text-xs px-5 transition-opacity hover:opacity-70"
                style={{ color: "var(--muted)" }}
              >
                dashboard
              </Link>
            ) : (
              <form className="flex items-stretch" action={async () => { "use server"; await signIn("github"); }}>
                <button
                  type="submit"
                  className="flex items-center gap-2 text-xs px-5 transition-opacity hover:opacity-70"
                  style={{ color: "var(--muted)" }}
                >
                  <GitHubLogoIcon width={12} height={12} />
                  sign in
                </button>
              </form>
            )}
            {/* vertical divider */}
            <div className="self-stretch" style={{ width: "1px", borderRight: "1px dashed var(--border)" }} />
            <a
              href="https://github.com/timmywheels/essay/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs px-5 transition-opacity hover:opacity-70"
              style={{ color: "var(--muted)" }}
            >
              <DownloadIcon width={12} height={12} />
              download cli
            </a>
            {/* vertical divider */}
            <div className="self-stretch" style={{ width: "1px", borderRight: "1px dashed var(--border)" }} />
            <ThemeToggle className="flex items-center px-4 transition-opacity hover:opacity-60" />
          </div>
        </div>
      </nav>

      <main>
        {/* ── Hero ── */}
        <section className="max-w-2xl mx-auto px-6 py-24 text-center">
          <TextSelectIcon size={32} className="mx-auto mb-8" color="var(--muted)" />
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-5" style={{ color: "var(--foreground)", lineHeight: 1.2 }}>
            A blog that lives in<br />your git repo.
          </h1>
          <p className="text-base mb-4 leading-relaxed" style={{ color: "var(--muted)" }}>
            Write from your terminal or your browser. Publish in one command&nbsp;— or one click.
          </p>
          <p className="text-sm mb-12 leading-relaxed" style={{ color: "var(--muted)", opacity: 0.7 }}>
            essay.sh turns a GitHub repo into a blog on your own domain. Draft in markdown, commit when it's ready, and it's live in under a minute.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch mb-6">
            {session ? (
              <Link
                href="/dashboard"
                className="flex-1 inline-flex items-center justify-center gap-2 py-4 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ border: "1px dashed var(--border)", color: "var(--foreground)", borderRadius: 0 }}
              >
                go to dashboard
              </Link>
            ) : (
              <form className="flex-1" action={async () => { "use server"; await signIn("github"); }}>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-4 text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ border: "1px dashed var(--border)", color: "var(--foreground)", borderRadius: 0 }}
                >
                  <GitHubLogoIcon width={15} height={15} />
                  sign in with github
                </button>
              </form>
            )}
            <a
              href="https://github.com/timmywheels/essay/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 py-4 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ border: "1px dashed var(--border)", borderLeft: "none", color: "var(--muted)", borderRadius: 0 }}
            >
              <DownloadIcon width={15} height={15} />
              download cli
            </a>
          </div>
          <CopyInstall />
        </section>

        {/* ── Three-up features ── */}
        <section style={{ borderTop: "1px dashed var(--border)" }}>
          <div className="max-w-4xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-3 text-xs" style={{ color: "var(--muted)" }}>
            <div className="space-y-2 px-8 py-8 sm:py-0" style={{ borderBottom: "1px dashed var(--border)" }}>
              <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>live in 60 seconds</p>
              <p className="leading-relaxed">Connect a GitHub repo, point your domain, done. No build configs, no YAML graveyard, no dashboards to babysit.</p>
            </div>
            <div className="space-y-2 px-8 py-8 sm:py-0 sm:border-l sm:border-r sm:border-dashed sm:border-border" style={{ borderBottom: "1px dashed var(--border)" }}>
              <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>write from anywhere</p>
              <p className="leading-relaxed">Draft in Vim at 2am. Edit in the browser on your phone. Paste from Cursor. It's all the same markdown files in the same repo&nbsp;— pick your weapon.</p>
            </div>
            <div className="space-y-2 px-8 py-8 sm:py-0">
              <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>your words, your repo, forever</p>
              <p className="leading-relaxed">No lock-in, no export button, no migration dread. The repo is the blog. Delete essay.sh tomorrow and your writing is still sitting in main.</p>
            </div>
          </div>
        </section>

        {/* ── Two ways to ship ── */}
        <section style={{ borderTop: "1px dashed var(--border)" }}>
          <div className="max-w-4xl mx-auto px-6 py-16">
            <h2 className="text-sm font-medium mb-10 text-center" style={{ color: "var(--foreground)" }}>
              Two ways to ship. Same git history.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Terminal card */}
              <div style={{ border: "1px dashed var(--border)" }}>
                {/* window chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3" style={{ borderBottom: "1px dashed var(--border)" }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--border)" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--border)" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--border)" }} />
                  <span className="ml-3 text-xs" style={{ color: "var(--muted)", opacity: 0.5 }}>terminal</span>
                </div>
                {/* terminal body */}
                <div className="px-5 py-5 font-mono text-xs space-y-3" style={{ background: "var(--foreground)", color: "var(--background)", minHeight: "200px" }}>
                  <div className="space-y-1">
                    <p><span style={{ opacity: 0.5 }}>$</span> essay new <span style={{ opacity: 0.8 }}>&quot;why I left substack&quot;</span></p>
                    <p style={{ opacity: 0.6 }}>&nbsp;&nbsp;→ drafts/why-i-left-substack.md</p>
                  </div>
                  <div className="space-y-1">
                    <p><span style={{ opacity: 0.5 }}>$</span> essay publish</p>
                    <p><span style={{ color: "var(--background)", opacity: 0.9 }}>✓</span> <span style={{ opacity: 0.7 }}>committed to main</span></p>
                    <p><span style={{ color: "var(--background)", opacity: 0.9 }}>✓</span> <span style={{ opacity: 0.7 }}>live at tim.essay.sh/why-i-left-substack</span></p>
                    <p style={{ opacity: 0.4 }}>&nbsp;&nbsp;⧖ 3.2s</p>
                  </div>
                </div>
                <p className="px-5 py-4 text-xs" style={{ color: "var(--muted)", borderTop: "1px dashed var(--border)" }}>
                  For when you're already in the shell and don't want to leave.
                </p>
              </div>

              {/* Browser card */}
              <div style={{ border: "1px dashed var(--border)" }}>
                {/* window chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3" style={{ borderBottom: "1px dashed var(--border)" }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--border)" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--border)" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--border)" }} />
                  <span
                    className="ml-3 flex-1 px-2 py-0.5 text-xs font-mono"
                    style={{ border: "1px dashed var(--border)", color: "var(--muted)", opacity: 0.6 }}
                  >
                    tim.essay.sh/new
                  </span>
                </div>
                {/* editor mock */}
                <div className="grid grid-cols-2" style={{ minHeight: "200px", borderBottom: "1px dashed var(--border)" }}>
                  {/* markdown pane */}
                  <div className="px-4 py-4 text-xs font-mono space-y-2" style={{ borderRight: "1px dashed var(--border)", color: "var(--muted)" }}>
                    <p style={{ opacity: 0.4, fontSize: "10px" }}>markdown</p>
                    <p style={{ color: "var(--foreground)" }}># Why I left substack</p>
                    <p style={{ opacity: 0.7 }}>After three years and 4,000</p>
                    <p style={{ opacity: 0.7 }}>subscribers, I decided...</p>
                    <p className="mt-2" style={{ opacity: 0.7 }}>The thing about platforms</p>
                    <p style={{ opacity: 0.7 }}>is that they own the...</p>
                    <span className="inline-block w-1.5 h-3.5 animate-pulse" style={{ background: "var(--foreground)", verticalAlign: "text-bottom" }} />
                  </div>
                  {/* preview pane */}
                  <div className="px-4 py-4 text-xs space-y-2" style={{ color: "var(--muted)" }}>
                    <p style={{ opacity: 0.4, fontSize: "10px" }}>preview</p>
                    <p className="font-semibold" style={{ color: "var(--foreground)", fontSize: "13px" }}>Why I left substack</p>
                    <p className="leading-relaxed" style={{ opacity: 0.7 }}>After three years and 4,000 subscribers, I decided...</p>
                    <p className="leading-relaxed" style={{ opacity: 0.7 }}>The thing about platforms is that they own the...</p>
                  </div>
                </div>
                {/* publish button */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--muted)", opacity: 0.5 }}>draft · unsaved</span>
                  <button
                    className="text-xs px-4 py-1.5 font-medium transition-opacity hover:opacity-70"
                    style={{ border: "1px dashed var(--border)", color: "var(--foreground)", borderRadius: 0 }}
                    disabled
                  >
                    publish
                  </button>
                </div>
                <p className="px-5 py-4 text-xs" style={{ color: "var(--muted)", borderTop: "1px dashed var(--border)" }}>
                  For when you're on the couch, at the coffee shop, or explaining the product to someone who doesn't own a terminal.
                </p>
              </div>

            </div>
            <p className="text-center mt-10 text-xs" style={{ color: "var(--muted)", opacity: 0.7 }}>
              Both hit the same repo. Both are just git.
            </p>
          </div>
        </section>

        {/* ── Who it's for ── */}
        <section style={{ borderTop: "1px dashed var(--border)" }}>
          <div className="max-w-2xl mx-auto px-6 py-14 text-center">
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              Built for developers who write, writers who code, and anyone tired of their blog being held hostage by a CMS.
            </p>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section style={{ borderTop: "1px dashed var(--border)" }}>
          <div className="max-w-md mx-auto px-6 py-24 text-center space-y-8">
            <h2 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
              Your next post is one commit away.
            </h2>
            {session ? (
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 py-4 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ border: "1px dashed var(--border)", color: "var(--foreground)", borderRadius: 0 }}
              >
                go to dashboard
              </Link>
            ) : (
              <form action={async () => { "use server"; await signIn("github"); }}>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-4 text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ border: "1px dashed var(--border)", color: "var(--foreground)", borderRadius: 0 }}
                >
                  <GitHubLogoIcon width={15} height={15} />
                  sign in with github
                </button>
              </form>
            )}
            <CopyInstall />
            <p className="text-xs" style={{ color: "var(--muted)", opacity: 0.6 }}>
              Free while in beta. No credit card, no &ldquo;book a demo.&rdquo;
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px dashed var(--border)" }}>
        <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
          <div className="flex items-center gap-2" style={{ opacity: 0.7 }}>
            <TextSelectIcon size={13} color="var(--muted)" />
            <span>essay.sh</span>
          </div>
          <div className="flex items-center gap-6" style={{ opacity: 0.6 }}>
            <a
              href="https://github.com/timmywheels/essay"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-100"
            >
              github
            </a>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
