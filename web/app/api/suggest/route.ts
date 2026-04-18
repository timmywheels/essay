import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { resolveUser } from "@/lib/cli-auth";

const requestSchema = z.object({
  just: z.boolean().optional().default(false),
  answers: z.array(z.string()).optional().default([]),
});

const QUALIFYING_QUESTIONS = [
  "What topics or ideas have you been thinking about lately?",
  "Who is your primary audience?",
];

export async function POST(req: Request) {
  const resolved = await resolveUser(req);
  if (!resolved) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { answers } = parsed.data;

  const posts = await db.post.findMany({
    where: { userId: resolved.userId },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { title: true },
  });

  const hasPosts = posts.length > 0;
  const hasAnswers = answers.some((a) => a.trim().length > 0);

  let userPrompt = "";

  if (hasPosts) {
    const postList = posts.map((p) => `- "${p.title}"`).join("\n");
    userPrompt += `My existing blog posts:\n${postList}\n\n`;
  }

  if (hasAnswers) {
    const qa = answers
      .map((a, i) => `${QUALIFYING_QUESTIONS[i] ?? `Q${i + 1}`}: ${a}`)
      .filter((_, i) => answers[i]?.trim())
      .join("\n");
    userPrompt += `Additional context:\n${qa}\n\n`;
  }

  if (!hasPosts && !hasAnswers) {
    userPrompt = "I'm starting a new blog and haven't written anything yet.\n\n";
  }

  userPrompt +=
    "Suggest 5 specific, compelling blog post topics. Return ONLY a JSON array of 5 strings, nothing else.";

  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system:
      "You are a blog topic generator for essay.sh, a platform for technical writers and developers. " +
      "Suggest specific, actionable topic ideas based on the writer's existing content and context. " +
      "Return ONLY a valid JSON array of exactly 5 topic strings. No preamble, no explanation, just the JSON array.",
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "[]";
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let suggestions: string[];
  try {
    suggestions = JSON.parse(text);
    if (!Array.isArray(suggestions)) throw new Error("Not an array");
    suggestions = suggestions.slice(0, 5).map(String);
  } catch {
    return NextResponse.json({ error: "Failed to parse suggestions" }, { status: 500 });
  }

  return NextResponse.json({ suggestions });
}
