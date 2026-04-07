import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });

  if (!user) redirect("/api/auth/signout");
  if (!user.username) redirect("/onboarding");

  redirect(`/${user.username}`);
}
