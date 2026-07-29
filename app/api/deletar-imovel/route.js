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

    if (!id && id !== 0) {
      return NextResponse.json(
        { error: 'ID do imóvel não foi informado.' },
        { status: 400 }
      );
    }

    // 1. Tratar o Tipo Correto do id (Number se for numérico, String se for UUID/text)
    const isNumeric = !isNaN(Number(id)) && String(id).trim() !== '';
    const idCorreto = isNumeric ? Number(id) : String(id).trim();

    console.log(`🗑️ [DELETAR IMOVEL] Iniciando exclusão. ID Bruto:`, id, `| Parsed:`, idCorreto, `| Tipo:`, typeof idCorreto);

    // 1.1 Busca as fotos salvas do imóvel no Supabase antes do DELETE
    const { data: imovel } = await supabaseAdmin
      .from('imoveis')
      .select('id, fotos')
      .eq('id', idCorreto)
      .maybeSingle();

    // 2. Se houver fotos no R2, realiza a exclusão física no bucket R2 via AWS SDK
    if (imovel?.fotos && Array.isArray(imovel.fotos) && imovel.fotos.length > 0) {
      console.log(`🗑️ [DELETAR IMOVEL] Excluindo ${imovel.fotos.length} fotos do Cloudflare R2...`, imovel.fotos);
      await deleteR2Objects(imovel.fotos);
    }

    // 3. Executa a exclusão da linha na tabela imoveis no Supabase via Admin Client
    const { error: deleteError, count } = await supabaseAdmin
      .from('imoveis')
      .delete({ count: 'exact' })
      .eq('id', idCorreto);

    console.log('Tentando deletar ID:', idCorreto, '| Tipo:', typeof idCorreto, '| Linhas afetadas:', count);

    // 4. Regra de Validação Estrita: Se error existir OU se count === 0, a operação FALHOU
    if (deleteError || count === 0) {
      console.error('❌ Erro/Falha no Supabase ao deletar imóvel:', deleteError || 'Count 0 linhas afetadas');
      return NextResponse.json(
        { error: deleteError?.message || 'Nenhum imóvel foi deletado no banco de dados.' },
        { status: 500 }
      );
    }

    console.log(`✅ [DELETAR IMOVEL SUCCESS] ${count} linha(s) afetada(s) no Supabase. Registro excluído definitivamente.`);

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
