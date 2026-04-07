import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session) redirect("/");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (user?.username) redirect("/dashboard");

  return <OnboardingForm suggestion={user?.githubUsername ?? ""} />;
}
