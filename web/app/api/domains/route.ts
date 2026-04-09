import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { addDomainToVercel, removeDomainFromVercel } from "@/lib/vercel-domains";

function normalizeDomain(raw: string): string {
  return raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase().trim();
}

const domainSchema = z.object({
  domain: z.string()
    .transform(normalizeDomain)
    .refine((v) => /^[a-z0-9]([a-z0-9\-\.]+)?[a-z0-9]$/.test(v), "Invalid domain format"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = domainSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const domain = parsed.data.domain;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { settings: { select: { customDomain: true } } },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Remove old domain from Vercel if switching
  const oldDomain = user.settings?.customDomain;
  if (oldDomain && oldDomain !== domain) {
    await removeDomainFromVercel(oldDomain);
    await updateEdgeConfig(oldDomain, null);
  }

  // Check domain isn't taken by another user
  const existing = await db.userSettings.findUnique({ where: { customDomain: domain } });
  if (existing && existing.userId !== user.id) {
    return NextResponse.json({ error: "Domain already in use" }, { status: 409 });
  }

  // Register with Vercel
  const vercelResult = await addDomainToVercel(domain);

  // Save to DB
  await db.userSettings.upsert({
    where: { userId: user.id },
    update: { customDomain: domain, domainVerifiedAt: null },
    create: { userId: user.id, customDomain: domain, domainVerifiedAt: null },
  });

  // Write to Edge Config for fast middleware lookup
  await updateEdgeConfig(domain, user.username!);

  return NextResponse.json({
    domain,
    verified: vercelResult.verified ?? false,
    verification: vercelResult.verification,
    cnames: vercelResult.cnames ?? [],
    aValues: vercelResult.aValues ?? [],
  });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await db.userSettings.findUnique({ where: { userId: session.user.id } });
  if (!settings?.customDomain) return NextResponse.json({ error: "No domain set" }, { status: 400 });

  // Order matters: Edge Config first, then DB, then Vercel
  await updateEdgeConfig(settings.customDomain, null);
  await db.userSettings.update({ where: { userId: session.user.id }, data: { customDomain: null, domainVerifiedAt: null } });
  await removeDomainFromVercel(settings.customDomain);

  return NextResponse.json({ ok: true });
}

async function updateEdgeConfig(domain: string, username: string | null) {
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const token = process.env.VERCEL_API_TOKEN;
  const teamQuery = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : "";
  if (!edgeConfigId || !token) return;

  const items = username
    ? [{ operation: "upsert", key: domain, value: username }]
    : [{ operation: "delete", key: domain }];

  const res = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items${teamQuery}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    console.error("Edge Config write failed", res.status, await res.text());
  }
}
