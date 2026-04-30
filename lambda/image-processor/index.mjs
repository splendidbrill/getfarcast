import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const s3 = new S3Client({});

export const handler = async (event) => {
  for (const record of event.Records) {
    const sqsBody = JSON.parse(record.body);
    const objectKey = decodeURIComponent(
      sqsBody.Records[0].s3.object.key.replace(/\+/g, " ")
    );
    const bucket = sqsBody.Records[0].s3.bucket.name;

    const { Body } = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: objectKey })
    );
    const buffer = Buffer.from(await Body.transformToByteArray());

    const webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();

    const baseName = objectKey
      .replace(/^uploads\//, "")
      .replace(/\.[^/.]+$/, "");

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `optimized/${baseName}.webp`,
        Body: webpBuffer,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    console.log(`Processed ${objectKey} → optimized/${baseName}.webp`);
  }
};
