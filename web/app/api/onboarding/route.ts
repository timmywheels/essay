import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  username: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/, "Username may only contain lowercase letters, numbers, and hyphens"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { username } = parsed.data;

  const taken = await db.user.findUnique({ where: { username } });
  if (taken) return NextResponse.json({ error: "Username is taken." }, { status: 409 });

  await db.user.update({ where: { id: session.user.id }, data: { username } });

  return NextResponse.json({ ok: true });
}
