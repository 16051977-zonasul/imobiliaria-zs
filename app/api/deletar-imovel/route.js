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

    const targetId = !isNaN(Number(id)) ? Number(id) : id;
    console.log(`🗑️ [DELETAR IMOVEL] Iniciando exclusão física do imóvel ID: ${id} (parsed: ${targetId})`);

    // 1. Busca as fotos salvas do imóvel antes do DELETE
    let { data: imovel } = await supabaseAdmin
      .from('imoveis')
      .select('id, fotos')
      .eq('id', targetId)
      .maybeSingle();

    if (!imovel && typeof id === 'string') {
      const { data: fallbackImovel } = await supabaseAdmin
        .from('imoveis')
        .select('id, fotos')
        .eq('id', id)
        .maybeSingle();
      if (fallbackImovel) imovel = fallbackImovel;
    }

    // 2. Se houver fotos no R2, realiza a exclusão física no bucket
    if (imovel?.fotos && Array.isArray(imovel.fotos) && imovel.fotos.length > 0) {
      console.log(`🗑️ [DELETAR IMOVEL] Excluindo ${imovel.fotos.length} fotos do Cloudflare R2...`, imovel.fotos);
      await deleteR2Objects(imovel.fotos);
    }

    // 3. Executa a exclusão da linha na tabela imoveis no Supabase via Admin Client
    const { error: deleteError, count } = await supabaseAdmin
      .from('imoveis')
      .delete({ count: 'exact' })
      .or(`id.eq.${targetId},id.eq.${id}`);

    if (deleteError) {
      console.error('❌ Erro no Supabase ao deletar imóvel:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Erro ao excluir imóvel no banco de dados Supabase.' },
        { status: 500 }
      );
    }

    console.log(`✅ [DELETAR IMOVEL SUCCESS] Registros removidos no Supabase: ${count ?? 'ok'}. Fotos R2 limpas.`);

    return NextResponse.json({
      success: true,
      message: 'Imóvel e fotos excluídos permanentemente do sistema Imóveis Zona Sul Rio de Janeiro',
    });

  } catch (err) {
    console.error('❌ [DELETAR IMOVEL ERROR]:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao excluir imóvel.' },
      { status: 500 }
    );
  }
}
