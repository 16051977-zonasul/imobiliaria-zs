import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { deleteR2Objects } from '@/lib/r2';

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

    console.log(`🗑️ [DELETAR IMOVEL] Iniciando exclusão do imóvel ID: ${id}`);

    // 1. Busca as fotos do imóvel no Supabase
    const { data: imovel, error: fetchError } = await supabase
      .from('imoveis')
      .select('fotos')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.warn('Aviso ao buscar fotos do imóvel para exclusão:', fetchError.message);
    }

    // 2. Se houver fotos no R2, realiza a exclusão física do bucket
    if (imovel?.fotos && Array.isArray(imovel.fotos) && imovel.fotos.length > 0) {
      console.log(`🗑️ [DELETAR IMOVEL] Excluindo ${imovel.fotos.length} fotos do Cloudflare R2...`);
      await deleteR2Objects(imovel.fotos);
    }

    // 3. Apaga a linha da tabela imoveis no Supabase
    const { error: deleteError } = await supabase
      .from('imoveis')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erro ao deletar imóvel no Supabase:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Erro ao excluir imóvel no banco de dados.' },
        { status: 500 }
      );
    }

    console.log(`✅ [DELETAR IMOVEL SUCCESS] Imóvel ${id} e suas fotos no R2 foram permanentemente excluídos.`);

    return NextResponse.json({
      success: true,
      message: 'Imóvel e fotos excluídos com sucesso do Cloudflare R2 e Supabase.',
    });

  } catch (err) {
    console.error('❌ [DELETAR IMOVEL ERROR]:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao excluir imóvel.' },
      { status: 500 }
    );
  }
}
