import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { User } from "@/app/generated/prisma/client";

type AuthResult =
  | { user: User; userId: string }
  | null;

export async function resolveUser(req: Request): Promise<AuthResult> {
  // Try Bearer token first (CLI)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = await db.user.findUnique({ where: { cliToken: token } });
    if (!user) return null;
    return { user, userId: user.id };
  }

  // Fall back to session (web)
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;
  return { user, userId: user.id };
}
