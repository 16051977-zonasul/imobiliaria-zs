import { S3Client, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
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
 * Gera uma URL pré-assinada para upload direto de imagens em WebP no R2
 */
export async function generatePresignedUploadUrl(filename, contentType = 'image/webp') {
  // Assegura extensão .webp no nome do arquivo
  const cleanFilename = filename.replace(/\.[^/.]+$/, "") + ".webp";
  const fileKey = `imoveis/${Date.now()}-${cleanFilename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || 'imoveis',
    Key: fileKey,
    ContentType: 'image/webp',
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
  const publicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || 'https://pub-42d565a9b2e84ce4986d533a9e7a3358.r2.dev';
  const publicUrl = `${publicBaseUrl.replace(/\/$/, '')}/${fileKey}`;

  return {
    uploadUrl,
    publicUrl,
    fileKey,
  };
}

/**
 * Exclui múltiplos objetos do Cloudflare R2 por suas chaves (keys) ou URLs públicas
 */
export async function deleteR2Objects(objectKeysOrUrls = []) {
  if (!objectKeysOrUrls || objectKeysOrUrls.length === 0) return;

  const bucketName = process.env.R2_BUCKET_NAME || 'imoveis';

  const keys = objectKeysOrUrls
    .map((urlOrKey) => {
      if (typeof urlOrKey !== 'string') return null;
      if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
        try {
          const parsed = new URL(urlOrKey);
          return parsed.pathname.replace(/^\//, '');
        } catch (e) {
          return urlOrKey;
        }
      }
      return urlOrKey;
    })
    .filter(Boolean);

  if (keys.length === 0) return;

  try {
    const command = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: true,
      },
    });

    await r2Client.send(command);
    console.log(`[R2] ${keys.length} fotos excluídas com sucesso do Cloudflare R2.`);
  } catch (err) {
    console.warn('[R2 Warning] Erro ao deletar fotos do Cloudflare R2:', err);
  }
}
