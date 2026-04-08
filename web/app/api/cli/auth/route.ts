import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { github_token } = await req.json();
  if (!github_token) {
    return NextResponse.json({ error: "github_token required" }, { status: 400 });
  }

  // Verify token with GitHub and get user info
  const ghRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${github_token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!ghRes.ok) {
    return NextResponse.json({ error: "invalid github token" }, { status: 401 });
  }

  const ghUser = await ghRes.json();
  const githubUsername: string = ghUser.login;

  const token = randomBytes(32).toString("hex");

  const user = await db.user.upsert({
    where: { githubUsername },
    update: {},
    create: {
      githubUsername,
      username: githubUsername,
      name: ghUser.name ?? githubUsername,
      email: ghUser.email ?? undefined,
      image: ghUser.avatar_url ?? undefined,
      cliToken: token,
    },
  });

  // Issue a CLI token if not already set
  if (!user.cliToken) {
    await db.user.update({ where: { id: user.id }, data: { cliToken: token } });
  }

  return NextResponse.json({ token: user.cliToken ?? token, username: user.username ?? githubUsername });
}
