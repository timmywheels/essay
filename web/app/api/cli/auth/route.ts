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

  const user = await db.user.findUnique({ where: { githubUsername } });
  if (!user) {
    return NextResponse.json({ error: "no account found — sign in at essay.sh first" }, { status: 404 });
  }

  // Issue a CLI token if not already set
  let token = user.cliToken;
  if (!token) {
    token = randomBytes(32).toString("hex");
    await db.user.update({ where: { id: user.id }, data: { cliToken: token } });
  }

  return NextResponse.json({ token, username: user.username ?? githubUsername });
}
