import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { addDomainToVercel, removeDomainFromVercel } from "@/lib/vercel-domains";

function normalizeDomain(raw: string): string {
  return raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase().trim();
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { domain: rawDomain } = await req.json();
  if (!rawDomain) return NextResponse.json({ error: "domain required" }, { status: 400 });

  const domain = normalizeDomain(rawDomain);
  if (!/^[a-z0-9]([a-z0-9\-\.]+)?[a-z0-9]$/.test(domain)) {
    return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Remove old domain from Vercel if switching
  if (user.customDomain && user.customDomain !== domain) {
    await removeDomainFromVercel(user.customDomain);
    await updateEdgeConfig(user.customDomain, null);
  }

  // Check domain isn't taken by another user
  const existing = await db.user.findUnique({ where: { customDomain: domain } });
  if (existing && existing.id !== user.id) {
    return NextResponse.json({ error: "Domain already in use" }, { status: 409 });
  }

  // Register with Vercel
  const vercelResult = await addDomainToVercel(domain);

  // Save to DB
  await db.user.update({
    where: { id: user.id },
    data: { customDomain: domain, domainVerifiedAt: null },
  });

  // Write to Edge Config for fast middleware lookup
  await updateEdgeConfig(domain, user.username!);

  return NextResponse.json({ domain, verified: vercelResult.verified ?? false, verification: vercelResult.verification });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.customDomain) return NextResponse.json({ error: "No domain set" }, { status: 400 });

  // Order matters: Edge Config first, then DB, then Vercel
  await updateEdgeConfig(user.customDomain, null);
  await db.user.update({ where: { id: user.id }, data: { customDomain: null, domainVerifiedAt: null } });
  await removeDomainFromVercel(user.customDomain);

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

  await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items${teamQuery}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
}
