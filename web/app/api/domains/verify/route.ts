import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getDomainVerification } from "@/lib/vercel-domains";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.customDomain) return NextResponse.json({ error: "No domain set" }, { status: 400 });

  const result = await getDomainVerification(user.customDomain);
  const verified = result.verified === true;

  if (verified && !user.domainVerifiedAt) {
    await db.user.update({ where: { id: user.id }, data: { domainVerifiedAt: new Date() } });
  }

  return NextResponse.json({
    verified,
    verification: result.verification ?? [],
    cnames: result.cnames ?? [],
    aValues: result.aValues ?? [],
  });
}
