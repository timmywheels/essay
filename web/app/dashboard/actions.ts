"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function deletePost(postId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.post.delete({
    where: { id: postId, userId: session.user.id },
  });

  revalidatePath("/dashboard");
}
