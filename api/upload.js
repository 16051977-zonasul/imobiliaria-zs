import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente do Cloudflare R2 usando a SDK S3
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
      return res.status(400).json({ error: 'Nome do arquivo e tipo de conteúdo são obrigatórios' });
    }

    // 1. Gera nome único para o arquivo no R2
    const fileKey = `imoveis/${Date.now()}-${filename}`;

    // 2. Monta a URL pública do arquivo
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`;

    // 3. Salva os dados do imóvel e a URL da foto no Supabase
    const { data: imovel, error: dbError } = await supabase
      .from('imoveis')
      .insert([
        {
          ...imovelData,
          foto_url: publicUrl,
        },
      ])
      .select();

    if (dbError) throw dbError;

    return res.status(200).json({
      success: true,
      message: 'Imóvel registrado com sucesso!',
      fileKey,
      publicUrl,
      imovel: imovel[0],
    });

  } catch (error) {
    console.error('Erro no processamento:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}