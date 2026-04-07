import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ConnectSteps from "./connect-steps";

export default async function ConnectPage() {
  const session = await auth();
  if (!session) redirect("/");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.username) redirect("/onboarding");
  if (user.githubInstallationId) redirect("/dashboard");

  const appName = process.env.GITHUB_APP_NAME;

  return (
    <ConnectSteps
      installUrl={`https://github.com/apps/${appName}/installations/new`}
      newRepoUrl="https://github.com/new?name=essays&description=My+essay.sh+posts&visibility=private"
    />
  );
}
