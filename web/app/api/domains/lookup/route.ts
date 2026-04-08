import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");
  if (!domain) return Response.json({ username: null });

  const user = await db.user.findUnique({
    where: { customDomain: domain },
    select: { username: true },
  });

  return Response.json({ username: user?.username ?? null });
}
