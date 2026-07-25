import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente do Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Inicializa o Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { filename, contentType, imovelData } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'Nome do arquivo e contentType são obrigatórios' });
    }

    // 1. Gera nome único para o arquivo no R2 (garantindo extensão .webp)
    const cleanFilename = filename.replace(/\.[^/.]+$/, "") + ".webp";
    const fileKey = `imoveis/${Date.now()}-${cleanFilename}`;

    // 2. Cria o comando PutObject para upload no R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType || 'image/webp',
    });

    // 3. Gera a URL pré-assinada válida por 5 minutos (300 segundos)
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });

    // 4. Monta a URL pública final onde a imagem ficará acessível
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`;

    // 5. Registra o imóvel no Supabase caso os dados tenham sido enviados
    let imovelSalvo = null;
    if (imovelData) {
      const { data, error: dbError } = await supabase
        .from('imoveis')
        .insert([{ ...imovelData, foto_url: publicUrl }])
        .select();

      if (dbError) throw dbError;
      imovelSalvo = data[0];
    }

    return res.status(200).json({
      success: true,
      uploadUrl,
      publicUrl,
      fileKey,
      imovel: imovelSalvo,
    });

  } catch (error) {
    console.error('Erro no upload.js:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}