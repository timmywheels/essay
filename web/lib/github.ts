import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

function getAppAuth(installationId: string) {
  const privateKey = (process.env.GITHUB_APP_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  return createAppAuth({
    appId: Number(process.env.GITHUB_APP_ID),
    privateKey,
    installationId: Number(installationId),
  });
}

export async function getInstallationOctokit(installationId: string) {
  const auth = getAppAuth(installationId);
  const { token } = await auth({ type: "installation" });
  return new Octokit({ auth: token });
}

export async function getInstallationRepos(installationId: string) {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await octokit.apps.listReposAccessibleToInstallation({ per_page: 100 });
  return data.repositories;
}

export function buildMarkdown(post: {
  title: string;
  slug: string;
  content: string;
  published: boolean;
  public: boolean;
  publishedAt: Date | null;
}) {
  const lines = [
    "---",
    `title: "${post.title.replace(/"/g, '\\"')}"`,
    `slug: ${post.slug}`,
    `date: ${(post.publishedAt || new Date()).toISOString().split("T")[0]}`,
    `published: ${post.published}`,
    `public: ${post.public}`,
    "---",
    "",
    post.content,
  ];
  return lines.join("\n");
}

export async function writePostToGitHub(
  octokit: Octokit,
  owner: string,
  repo: string,
  slug: string,
  markdown: string,
  title: string,
) {
  const path = `posts/${slug}.md`;
  const content = Buffer.from(markdown).toString("base64");

  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    sha = (data as { sha: string }).sha;
  } catch {}

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: sha ? `update: ${title || slug}` : `add: ${title || slug}`,
    content,
    ...(sha ? { sha } : {}),
  });
}

export async function deletePostFromGitHub(
  octokit: Octokit,
  owner: string,
  repo: string,
  slug: string,
) {
  const path = `posts/${slug}.md`;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    await octokit.repos.deleteFile({
      owner,
      repo,
      path,
      message: `remove: ${slug}`,
      sha: (data as { sha: string }).sha,
    });
  } catch {}
}
