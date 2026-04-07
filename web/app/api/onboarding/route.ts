import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await req.json();

  if (!username || username.length < 2 || username.length > 30 || !/^[a-z0-9-]+$/.test(username)) {
    return NextResponse.json({ error: "Invalid username." }, { status: 400 });
  }

  const taken = await db.user.findUnique({ where: { username } });
  if (taken) return NextResponse.json({ error: "Username is taken." }, { status: 409 });

  await db.user.update({ where: { id: session.user.id }, data: { username } });

  return NextResponse.json({ ok: true });
}
