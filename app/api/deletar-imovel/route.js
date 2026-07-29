import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deleteR2Objects } from '@/lib/r2';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Cliente Admin com Service Role Key para ignorar travas de RLS na exclusão
const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || 'placeholder-key'
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do imóvel não foi informado.' },
        { status: 400 }
      );
    }

    console.log(`🗑️ [DELETAR IMOVEL] Iniciando exclusão física do imóvel ID: ${id}`);

    // 1. Busca as fotos salvas do imóvel antes do DELETE
    const { data: imovel, error: fetchError } = await supabaseAdmin
      .from('imoveis')
      .select('id, fotos')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.warn('Aviso ao buscar fotos do imóvel para exclusão:', fetchError.message);
    }

    // 2. Se houver fotos no R2, realiza a exclusão física do bucket R2 via AWS SDK
    if (imovel?.fotos && Array.isArray(imovel.fotos) && imovel.fotos.length > 0) {
      console.log(`🗑️ [DELETAR IMOVEL] Excluindo ${imovel.fotos.length} fotos do Cloudflare R2...`, imovel.fotos);
      await deleteR2Objects(imovel.fotos);
    }

    // 3. Executa a exclusão da linha na tabela imoveis no Supabase via Admin Client
    const { error: deleteError } = await supabaseAdmin
      .from('imoveis')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Erro ao deletar imóvel no Supabase:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Erro ao excluir imóvel no banco de dados.' },
        { status: 500 }
      );
    }

    console.log(`✅ [DELETAR IMOVEL SUCCESS] Imóvel ID ${id} e suas fotos no R2 foram limpos com sucesso.`);

    return NextResponse.json({
      success: true,
      message: 'Imóvel e fotos excluídos permanentemente do R2 e Supabase.',
    });

  } catch (err) {
    console.error('❌ [DELETAR IMOVEL ERROR]:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao excluir imóvel.' },
      { status: 500 }
    );
  }
}
