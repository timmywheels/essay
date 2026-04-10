import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const schema = z.object({
  name:              z.string().trim().optional().nullable(),
  bio:               z.string().trim().max(280).optional().nullable(),
  profilePublic:     z.boolean().optional(),
  showUsername:      z.boolean().optional(),
  showActivityGraph: z.boolean().optional(),
  theme:             z.enum(["default", "gr", "pg"]).optional(),
  links:             z.array(z.object({ label: z.string(), url: z.string().url() })).max(5).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, bio, links, profilePublic, showUsername, showActivityGraph, theme } = parsed.data;

  const settingsUpdate: Record<string, unknown> = {};
  if (bio !== undefined) settingsUpdate.bio = bio;
  if (links !== undefined) settingsUpdate.links = links;
  if (profilePublic !== undefined) settingsUpdate.profilePublic = profilePublic;
  if (showUsername !== undefined) settingsUpdate.showUsername = showUsername;
  if (showActivityGraph !== undefined) settingsUpdate.showActivityGraph = showActivityGraph;
  if (theme !== undefined) settingsUpdate.theme = theme;

  await Promise.all([
    name !== undefined
      ? db.user.update({ where: { id: session.user.id }, data: { name } })
      : Promise.resolve(),
    Object.keys(settingsUpdate).length > 0
      ? db.userSettings.upsert({
          where: { userId: session.user.id },
          update: settingsUpdate,
          create: { userId: session.user.id, ...settingsUpdate },
        })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ ok: true });
}
