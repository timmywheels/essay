const BASE = "https://api.vercel.com";
const projectId = process.env.VERCEL_PROJECT_ID!;
const teamQuery = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : "";

const headers = {
  Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
  "Content-Type": "application/json",
};

export async function addDomainToVercel(domain: string) {
  const res = await fetch(`${BASE}/v10/projects/${projectId}/domains${teamQuery}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: domain }),
  });
  return res.json();
}

export async function removeDomainFromVercel(domain: string) {
  await fetch(`${BASE}/v9/projects/${projectId}/domains/${domain}${teamQuery}`, {
    method: "DELETE",
    headers,
  });
}

export async function getDomainVerification(domain: string) {
  const res = await fetch(
    `${BASE}/v10/projects/${projectId}/domains/${domain}${teamQuery}`,
    { headers }
  );
  return res.json();
}
