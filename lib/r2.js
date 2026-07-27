import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2AccountId || 'account-id'}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2AccessKeyId || '',
    secretAccessKey: r2SecretAccessKey || '',
  },
});

/**
 * Gera uma URL pré-assinada para upload direto de imagens no R2
 */
export async function generatePresignedUploadUrl(filename, contentType = 'image/webp') {
  const cleanFilename = filename.replace(/\.[^/.]+$/, "") + ".webp";
  const fileKey = `imoveis/${Date.now()}-${cleanFilename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || 'imoveis',
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
  const publicBaseUrl = process.env.R2_PUBLIC_URL || `https://${process.env.R2_BUCKET_NAME}.r2.dev`;
  const publicUrl = `${publicBaseUrl.replace(/\/$/, '')}/${fileKey}`;

  return {
    uploadUrl,
    publicUrl,
    fileKey,
  };
}
