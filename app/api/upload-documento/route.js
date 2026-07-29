import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId') || 'anon';

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo de documento foi enviado.' },
        { status: 400 }
      );
    }

    const fileExt = file.name.split('.').pop();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${userId}/${Date.now()}_${cleanFileName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`[API /upload-documento] Enviando arquivo para o bucket 'documentos', caminho: ${storagePath}`);

    // Upload direto para o bucket privado 'documentos'
    const { data, error } = await supabaseAdmin.storage
      .from('documentos')
      .upload(storagePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('[API /upload-documento] Erro no Supabase Storage:', error);

      // Fallback em Base64 caso o bucket não exista no Supabase
      const base64 = buffer.toString('base64');
      const fallbackUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`;

      return NextResponse.json({
        success: true,
        documentoUrl: fallbackUrl,
        warning: `Upload com fallback seguro devido a erro no Storage: ${error.message}`,
      });
    }

    // Gera a URL do documento (privada com signed URL ou referência)
    let documentoUrl = storagePath;
    const { data: signedData } = await supabaseAdmin.storage
      .from('documentos')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 ano

    if (signedData?.signedUrl) {
      documentoUrl = signedData.signedUrl;
    } else {
      const { data: publicData } = supabaseAdmin.storage
        .from('documentos')
        .getPublicUrl(storagePath);
      if (publicData?.publicUrl) {
        documentoUrl = publicData.publicUrl;
      }
    }

    return NextResponse.json({
      success: true,
      documentoUrl,
      path: data.path,
    });
  } catch (err) {
    console.error('[API /upload-documento] Erro de execução:', err);
    return NextResponse.json(
      { error: err.message || 'Erro ao processar e salvar documento.' },
      { status: 500 }
    );
  }
}
