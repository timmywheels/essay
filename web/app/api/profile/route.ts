import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profilePublic } = await req.json();
  if (typeof profilePublic !== "boolean") return NextResponse.json({ error: "profilePublic must be a boolean" }, { status: 400 });

  await db.user.update({ where: { id: session.user.id }, data: { profilePublic } });
  return NextResponse.json({ profilePublic });
}
