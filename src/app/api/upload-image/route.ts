import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSessionUser } from "@/lib/blogAuth";
import { randomUUID } from "crypto";
import sharp from "sharp";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];

export const config = { api: { bodyParser: false } };

export async function POST(request: Request) {
  const uid = await getSessionUser();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const uniqueFilename = `${randomUUID()}.${ext}`;
  const baseName = uniqueFilename.replace(/\.[^/.]+$/, "");
  const buffer = Buffer.from(await file.arrayBuffer());

  const optimizedBuffer = await sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  await Promise.all([
    s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `uploads/${uniqueFilename}`,
      Body: buffer,
      ContentType: file.type,
    })),
    s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `optimized/${baseName}.webp`,
      Body: optimizedBuffer,
      ContentType: "image/webp",
    })),
  ]);

  return NextResponse.json({ filename: uniqueFilename });
}
