import { NextResponse } from 'next/server';
import { generatePresignedUploadUrl } from '@/lib/r2';

export async function POST(request) {
  try {
    const body = await request.json();
    const { filename, contentType } = body;

    if (!filename) {
      return NextResponse.json(
        { error: 'O nome do arquivo (filename) é obrigatório.' },
        { status: 400 }
      );
    }

    const uploadData = await generatePresignedUploadUrl(filename, contentType || 'image/webp');

    return NextResponse.json({
      success: true,
      ...uploadData,
    });
  } catch (error) {
    console.error('Erro na Rota /api/upload:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao gerar URL pré-assinada para upload.' },
      { status: 500 }
    );
  }
}
