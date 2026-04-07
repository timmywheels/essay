import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Editor from "@/components/editor";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/");

  const [user, post] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id } }),
    db.post.findUnique({ where: { id } }),
  ]);

  if (!user?.username) redirect("/onboarding");
  if (!post || post.userId !== session.user.id) notFound();

  return <Editor username={user.username} post={post} />;
}
