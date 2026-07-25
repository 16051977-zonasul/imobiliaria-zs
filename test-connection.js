require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// 1. Instanciar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 2. Instanciar Cloudflare R2
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function testar() {
  console.log('🔄 Testando conexão com Supabase...');
  const { data, error } = await supabase.from('imoveis').select('*');
  if (error) {
    console.error('❌ Erro no Supabase:', error.message);
  } else {
    console.log('✅ Supabase conectado com sucesso! Registros encontrados:', data.length);
  }

  console.log('\n🔄 Testando conexão com Cloudflare R2...');
  try {
    await r2.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET_NAME }));
    console.log('✅ Cloudflare R2 conectado com sucesso!');
  } catch (err) {
    console.error('❌ Erro no Cloudflare R2:', err.message);
  }
}

testar();