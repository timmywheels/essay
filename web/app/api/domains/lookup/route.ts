import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");
  if (!domain) return Response.json({ username: null });

  const settings = await db.userSettings.findUnique({
    where: { customDomain: domain },
    include: { user: { select: { username: true } } },
  });

  return Response.json({ username: settings?.user?.username ?? null });
}
