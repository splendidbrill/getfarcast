import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

// Matches your AWS region
const s3 = new S3Client({ region: "eu-north-1" });

export const handler = async (event) => {
  for (const record of event.Records) {
    try {
      const sqsBody = JSON.parse(record.body);

      if (sqsBody.Event === "s3:TestEvent") {
        console.log("Test event received, skipping.");
        continue;
      }

      const sourceBucket = sqsBody.Records[0].s3.bucket.name;
      const objectKey = decodeURIComponent(sqsBody.Records[0].s3.object.key.replace(/\+/g, " "));

      console.log(`Processing image: ${objectKey}`);

      const getCommand = new GetObjectCommand({
        Bucket: sourceBucket,
        Key: objectKey,
      });
      const rawImageResponse = await s3.send(getCommand);
      const imageBuffer = await rawImageResponse.Body.transformToByteArray();

      const optimizedBuffer = await sharp(imageBuffer)
        .resize({ width: 1200, withoutEnlargement: true }) 
        .webp({ quality: 80 }) 
        .toBuffer();

      const baseFilename = objectKey.replace('uploads/', '');
      const newFilename = baseFilename.substring(0, baseFilename.lastIndexOf('.')) + '.webp';

      const destinationBucket = "farcast-blog-images"; 
      
      const putCommand = new PutObjectCommand({
        Bucket: destinationBucket,
        Key: `optimized/${newFilename}`,
        Body: optimizedBuffer,
        ContentType: "image/webp",
      });
      await s3.send(putCommand);

      console.log(`Successfully saved: optimized/${newFilename}`);

    } catch (error) {
      console.error("Error processing message:", error);
      throw error; 
    }
  }
};