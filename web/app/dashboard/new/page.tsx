import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Editor from "@/components/editor";

export default async function NewPostPage() {
  const session = await auth();
  if (!session) redirect("/");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.username) redirect("/onboarding");

  return <Editor username={user.username} />;
}
