import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const schema = z.object({
  name:          z.string().trim().optional().nullable(),
  bio:           z.string().trim().max(280).optional().nullable(),
  profilePublic:     z.boolean().optional(),
  showUsername:      z.boolean().optional(),
  showActivityGraph: z.boolean().optional(),
  links:         z.array(z.object({ label: z.string(), url: z.string().url() })).max(5).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const user = await db.user.update({ where: { id: session.user.id }, data: parsed.data });
  return NextResponse.json({ ok: true, profilePublic: user.profilePublic, showUsername: user.showUsername, name: user.name });
}
