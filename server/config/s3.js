const { S3Client, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin';
const S3_BUCKET = process.env.S3_BUCKET || 'task-attachments';
const S3_REGION = process.env.S3_REGION || 'us-east-1';

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // required for MinIO
});

let s3Available = false;

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    s3Available = true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404 || err.name === 'NoSuchBucket') {
      await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
      s3Available = true;
      console.log(`Created S3 bucket: ${S3_BUCKET}`);
    } else {
      console.warn(`Warning: S3/MinIO not available at ${S3_ENDPOINT} — file attachments will be disabled`);
      s3Available = false;
    }
  }
}

const isS3Available = () => s3Available;

module.exports = { s3, S3_BUCKET, ensureBucket, isS3Available };
