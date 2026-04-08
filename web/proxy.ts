import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";

const { auth } = NextAuth(authConfig);

const APP_HOSTNAME = "essay.sh";
const BLOCKED = ["dashboard", "connect", "onboarding"];

async function handleCustomDomain(req: NextRequest): Promise<NextResponse | null> {
  const hostname = (req.headers.get("host") ?? "").replace(/:\d+$/, "");
  const { pathname } = req.nextUrl;

  if (
    hostname === APP_HOSTNAME ||
    hostname === `www.${APP_HOSTNAME}` ||
    hostname.endsWith(".vercel.app") ||
    hostname === "localhost"
  ) {
    return null;
  }

  let username: string | null = null;
  try {
    username = (await get<string>(hostname)) ?? null;
  } catch {
    // Edge Config not configured — fall back to API lookup
    try {
      const res = await fetch(`https://${APP_HOSTNAME}/api/domains/lookup?domain=${hostname}`);
      if (res.ok) username = (await res.json()).username ?? null;
    } catch {
      // ignore
    }
  }

  if (!username) return new NextResponse("Domain not configured", { status: 404 });

  // Block dashboard/auth routes — redirect to essay.sh
  const first = pathname.split("/").filter(Boolean)[0] ?? "";
  if (BLOCKED.includes(first)) {
    return NextResponse.redirect(new URL(pathname, `https://${APP_HOSTNAME}`));
  }

  // Rewrite to [username] routes
  const segments = pathname.split("/").filter(Boolean);
  const target =
    segments.length === 0
      ? `/${username}`
      : segments.length === 1
        ? `/${username}/${segments[0]}`
        : pathname;

  return NextResponse.rewrite(new URL(target, req.url));
}

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)"],
};

export default async function proxy(req: NextRequest) {
  const customDomainResponse = await handleCustomDomain(req);
  if (customDomainResponse) return customDomainResponse;
  return (auth as any)(req);
}
