import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

const schema = z.object({
  github_token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "github_token required" }, { status: 400 });

  const { github_token } = parsed.data;

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
