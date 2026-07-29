import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deleteR2Objects } from '@/lib/r2';

export async function POST(request) {
  try {
    // 1. Validar a presença da SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('❌ [ERRO DE CONFIGURAÇÃO] Chave SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente.');
      return NextResponse.json(
        { error: 'Chave SUPABASE_SERVICE_ROLE_KEY não encontrada no ambiente.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    if (!body?.id) {
      return NextResponse.json(
        { error: 'ID do imóvel não foi informado.' },
        { status: 400 }
      );
    }

    const idUUID = String(body.id).trim();

    // 2. Instanciar o Supabase Admin diretamente com a Service Key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    console.log(`🗑️ [DELETAR IMOVEL] Tentando deletar imóvel por UUID: "${idUUID}"`);

    // 2.1 Busca as fotos salvas do imóvel antes do DELETE
    const { data: imovel } = await supabaseAdmin
      .from('imoveis')
      .select('id, fotos')
      .eq('id', idUUID)
      .maybeSingle();

    // Exclui fotos no Cloudflare R2 se existirem
    if (imovel?.fotos && Array.isArray(imovel.fotos) && imovel.fotos.length > 0) {
      console.log(`🗑️ [DELETAR IMOVEL] Excluindo ${imovel.fotos.length} fotos do Cloudflare R2...`, imovel.fotos);
      await deleteR2Objects(imovel.fotos);
    }

    // 3. Executar a remoção ignorando RLS via Service Role Key
    const { error: deleteError, count } = await supabaseAdmin
      .from('imoveis')
      .delete({ count: 'exact' })
      .eq('id', idUUID);

    console.log('Tentando deletar UUID:', idUUID, '| Linhas afetadas:', count, '| Erro:', deleteError);

    if (deleteError || count === 0) {
      console.error('❌ Erro/Falha no Supabase ao deletar UUID:', deleteError || 'Count 0 linhas afetadas');
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
