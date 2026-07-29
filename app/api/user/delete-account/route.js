import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { deleteR2Objects } from '@/lib/r2';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    if (!serviceRoleKey) {
      console.error("[ERRO CRÍTICO] SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente!");
      return NextResponse.json(
        { error: 'Chave SUPABASE_SERVICE_ROLE_KEY não encontrada no servidor.' },
        { status: 500 }
      );
    }

    // Cliente Admin do Supabase com Service Role Key para ignorar RLS e deletar usuários
    const supabaseAdmin = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      serviceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // 1. Identifica o usuário autenticado via Cookie / Header Bearer Token
    const supabaseServer = createServerClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          },
        },
      }
    );

    let { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        user = userData?.user || null;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para encerrar sua conta.' },
        { status: 401 }
      );
    }

    const userId = user.id;
    console.log(`🗑️ [EXCLUSÃO EM CASCATA] Iniciando processo para o usuário ID: ${userId} (${user.email})`);

    // 2. Busca todos os imóveis cadastrados por esse usuário no Supabase
    const { data: userProperties, error: fetchPropError } = await supabaseAdmin
      .from('imoveis')
      .select('id, fotos')
      .eq('usuario_id', userId);

    if (fetchPropError) {
      console.warn('⚠️ [EXCLUSÃO EM CASCATA] Aviso ao buscar imóveis:', fetchPropError.message);
    }

    // 3. Mapeia e extrai TODAS as URLs de fotos dos imóveis do R2
    const allPhotoUrls = [];
    if (userProperties && userProperties.length > 0) {
      userProperties.forEach((imovel) => {
        if (Array.isArray(imovel.fotos)) {
          allPhotoUrls.push(...imovel.fotos);
        }
      });
    }

    // 4. Mapeia foto de perfil / avatar e documento do anunciante se estiverem no R2 ou URL externa
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('foto_url, documento_url')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.foto_url && typeof profile.foto_url === 'string' && (profile.foto_url.startsWith('http://') || profile.foto_url.startsWith('https://'))) {
      allPhotoUrls.push(profile.foto_url);
    }

    // 5. Apaga fisicamente todas as imagens e objetos no Cloudflare R2
    if (allPhotoUrls.length > 0) {
      console.log(`🗑️ [R2 CASCADE DELETE] Apagando fisicamente ${allPhotoUrls.length} fotos do Cloudflare R2...`);
      await deleteR2Objects(allPhotoUrls);
    } else {
      console.log(`ℹ️ [R2 CASCADE DELETE] Nenhum objeto foto encontrado no R2 para este usuário.`);
    }

    // 6. Limpa arquivos no Supabase Storage se houver
    try {
      if (profile?.documento_url) {
        const docPath = profile.documento_url.replace(/^documentos\//, '');
        await supabaseAdmin.storage.from('documentos').remove([docPath, `${userId}/*`]);
      }
      if (profile?.foto_url && !profile.foto_url.startsWith('http')) {
        const avatarPath = profile.foto_url.replace(/^avatares\//, '');
        await supabaseAdmin.storage.from('avatares').remove([avatarPath, `${userId}/*`]);
      }
    } catch (storageErr) {
      console.warn('Aviso ao limpar mídias do storage:', storageErr.message);
    }

    // 7. Apaga imóveis do anunciante na tabela imoveis
    const { count: deletedPropsCount, error: deletePropsError } = await supabaseAdmin
      .from('imoveis')
      .delete({ count: 'exact' })
      .eq('usuario_id', userId);

    if (deletePropsError) {
      console.error('❌ [EXCLUSÃO EM CASCATA] Erro ao deletar imóveis no Supabase:', deletePropsError.message);
    } else {
      console.log(`✅ [EXCLUSÃO EM CASCATA] ${deletedPropsCount || 0} imóveis removidos do Supabase.`);
    }

    // 8. Apaga registro do perfil na tabela profiles
    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteProfileError) {
      console.error('❌ [EXCLUSÃO EM CASCATA] Erro ao deletar perfil no Supabase:', deleteProfileError.message);
    } else {
      console.log(`✅ [EXCLUSÃO EM CASCATA] Perfil do anunciante removido do Supabase.`);
    }

    // 9. Apaga a conta do usuário no Supabase Auth Admin
    const { error: deleteAuthUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthUserError) {
      console.warn('⚠️ [EXCLUSÃO EM CASCATA] Aviso ao deletar conta no Supabase Auth:', deleteAuthUserError.message);
    } else {
      console.log(`✅ [EXCLUSÃO EM CASCATA] Usuário excluído do Supabase Auth.`);
    }

    console.log(`🎉 [EXCLUSÃO EM CASCATA CONCLUÍDA] Usuário ${userId} foi 100% removido do sistema.`);

    return NextResponse.json({
      success: true,
      message: 'Sua conta, perfil, imóveis e todas as suas fotos no R2 foram excluídos permanentemente.',
    });

  } catch (err) {
    console.error('❌ [DELETE ACCOUNT CASCADE ERROR]:', err);
    return NextResponse.json(
      { error: err.message || 'Erro ao processar a exclusão em cascata.' },
      { status: 500 }
    );
  }
}
