import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getInstallationRepos } from "@/lib/github";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.redirect(new URL("/", req.url));

  const { searchParams } = new URL(req.url);
  const installationId = searchParams.get("installation_id");

  if (!installationId) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Find which repo the user gave us access to
  const repos = await getInstallationRepos(installationId);
  const repo = repos[0]; // user should only be granting one repo

  await db.user.update({
    where: { id: session.user.id },
    data: {
      githubInstallationId: installationId,
      githubRepo: repo?.name ?? null,
      githubUsername: repo?.owner.login ?? undefined,
    },
  });

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
