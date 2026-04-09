import { NextRequest, NextResponse } from "next/server";
import { put, head, BlobNotFoundError } from "@vercel/blob";
import { createHash } from "crypto";
import { auth } from "@/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 24);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const pathname = `images/${hash}.${ext}`;

  try {
    const existing = await head(pathname);
    return NextResponse.json({ url: existing.url });
  } catch (err) {
    if (!(err instanceof BlobNotFoundError)) throw err;
  }

  const blob = await put(pathname, buffer, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false,
  });
  return NextResponse.json({ url: blob.url });
}
