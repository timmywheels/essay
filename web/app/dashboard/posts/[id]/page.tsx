import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";

export default async function EditPostRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/");

  const [user, post] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id }, select: { username: true } }),
    db.post.findUnique({ where: { id }, select: { slug: true, userId: true } }),
  ]);

  if (!user?.username) redirect("/onboarding");
  if (!post || post.userId !== session.user.id) notFound();

  redirect(`/${user.username}/${post.slug}`);
}
