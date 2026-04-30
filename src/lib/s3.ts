import {
  S3Client,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export const BUCKET = process.env.S3_BUCKET_NAME!;

export async function deleteImageFromS3(src: string): Promise<void> {
  const domain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;
  if (!domain || !src.startsWith(domain)) return;

  const key = src.slice(domain.length).replace(/^\//, "");
  if (!key.startsWith("optimized/")) return;

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));

  // Also delete the original upload — list by UUID prefix since extension is unknown
  const uuid = key.replace("optimized/", "").replace(/\.[^/.]+$/, "");
  const { Contents } = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `uploads/${uuid}` })
  );
  if (Contents?.length) {
    await Promise.all(
      Contents.map((obj) =>
        s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: obj.Key! }))
      )
    );
  }
}
