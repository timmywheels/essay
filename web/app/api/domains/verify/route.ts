import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getDomainVerification, getDomainConfig } from "@/lib/vercel-domains";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await db.userSettings.findUnique({ where: { userId: session.user.id } });
  if (!settings?.customDomain) return NextResponse.json({ error: "No domain set" }, { status: 400 });

  const [result, config] = await Promise.all([
    getDomainVerification(settings.customDomain),
    getDomainConfig(settings.customDomain),
  ]);
  const verified = result.verified === true;

  if (verified && !settings.domainVerifiedAt) {
    await db.userSettings.update({ where: { userId: session.user.id }, data: { domainVerifiedAt: new Date() } });
  }

  return NextResponse.json({
    verified,
    verification: result.verification ?? [],
    cnames: config.cnames,
    aValues: config.aValues,
  });
}
