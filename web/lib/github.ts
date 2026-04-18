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

export type PostGit = {
  sha: string;
  count: number;
  message: string;
  date: string;
};

export async function getPostGit(
  octokit: Octokit,
  owner: string,
  repo: string,
  slug: string,
): Promise<PostGit | null> {
  try {
    const res = await octokit.repos.listCommits({
      owner,
      repo,
      path: `posts/${slug}.md`,
      per_page: 1,
    });
    const latest = res.data[0];
    if (!latest) return null;

    // Derive total commit count from the Link header's `rel="last"` page number
    // (with per_page=1, last-page == total commits).
    let count = 1;
    const link = (res.headers as Record<string, string | undefined>).link;
    if (link) {
      const m = link.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/);
      if (m) count = parseInt(m[1], 10);
    }

    return {
      sha: latest.sha,
      count,
      message: latest.commit.message ?? "",
      date: latest.commit.author?.date ?? latest.commit.committer?.date ?? "",
    };
  } catch {
    return null;
  }
}

export async function getPostContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  slug: string,
): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: `posts/${slug}.md` });
    const raw = Buffer.from((data as { content: string }).content, "base64").toString("utf-8");
    // Strip YAML frontmatter
    const match = raw.match(/^---\n[\s\S]*?\n---\n\n?([\s\S]*)$/);
    return match ? match[1].trim() : raw.trim();
  } catch {
    return null;
  }
}

/**
 * Rename (and optionally update) a post file in a single commit, using the Git
 * Data API. This preserves git-native rename detection — `git log --follow`
 * traces history across the rename, and GitHub's UI shows it as a rename.
 * Doing it via the Contents API instead produces two unrelated commits
 * (delete + add) with no relationship to each other.
 */
export async function renamePostOnGitHub(
  octokit: Octokit,
  owner: string,
  repo: string,
  oldSlug: string,
  newSlug: string,
  markdown: string,
  title: string,
) {
  const oldPath = `posts/${oldSlug}.md`;
  const newPath = `posts/${newSlug}.md`;

  const { data: repoInfo } = await octokit.repos.get({ owner, repo });
  const branch = repoInfo.default_branch;

  const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
  const parentSha = ref.object.sha;

  const { data: parentCommit } = await octokit.git.getCommit({ owner, repo, commit_sha: parentSha });

  const { data: blob } = await octokit.git.createBlob({
    owner,
    repo,
    content: Buffer.from(markdown).toString("base64"),
    encoding: "base64",
  });

  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: parentCommit.tree.sha,
    // A tree entry with sha: null removes the path from the tree.
    tree: [
      { path: newPath, mode: "100644", type: "blob", sha: blob.sha },
      { path: oldPath, mode: "100644", type: "blob", sha: null } as never,
    ],
  });

  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: `rename: ${oldSlug} → ${newSlug}${title ? ` (${title})` : ""}`,
    tree: tree.sha,
    parents: [parentSha],
  });

  await octokit.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: commit.sha });
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
