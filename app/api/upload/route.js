import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '@/lib/r2';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado no campo "file".' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Garante que o nome do arquivo tenha extensão .webp
    const originalName = file.name || 'imagem.webp';
    const cleanFilename = originalName.replace(/\.[^/.]+$/, '') + '.webp';
    const fileKey = `imoveis/${Date.now()}-${cleanFilename}`;

    const bucketName = process.env.R2_BUCKET_NAME || 'imoveis';

    // Upload direto via SDK S3 no lado do servidor (sem problemas de CORS no browser)
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: buffer,
      ContentType: 'image/webp',
    });

    await r2Client.send(command);

    const publicBaseUrl =
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
      process.env.R2_PUBLIC_URL ||
      'https://pub-42d565a9b2e84ce4986d533a9e7a3358.r2.dev';

    const publicUrl = `${publicBaseUrl.replace(/\/$/, '')}/${fileKey}`;

    console.log(`✅ [R2 UPLOAD SUCCESS] Imagem salva no Cloudflare R2: ${publicUrl}`);

    return NextResponse.json({
      success: true,
      publicUrl,
      fileKey,
    });
  } catch (error) {
    console.error('❌ [R2 UPLOAD ERROR] Falha na rota /api/upload:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer upload da imagem no Cloudflare R2.' },
      { status: 500 }
    );
  }
}
