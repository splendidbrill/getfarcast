import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSessionUser } from "@/lib/blogAuth";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];

export async function POST(request: Request) {
  const uid = await getSessionUser();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { filename, contentType } = body as { filename?: string; contentType?: string };

  if (!filename || !contentType) {
    return NextResponse.json({ error: "filename and contentType are required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const uniqueFilename = `${randomUUID()}.${ext}`;
  const key = `uploads/${uniqueFilename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return NextResponse.json({ uploadUrl, filename: uniqueFilename });
}
