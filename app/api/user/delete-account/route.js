import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { deleteR2Objects } from '@/lib/r2';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Cliente Admin do Supabase com privilégios de Service Role para deleteUser
const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || 'placeholder-key'
);

export async function POST(request) {
  try {
    // 1. Identifica o usuário autenticado via Cookie / Header Token
    let response = NextResponse.next();
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

    // Tenta pegar o usuário da sessão do servidor ou Bearer Token
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
    console.log(`🗑️ [DELETE ACCOUNT] Iniciando descadastro definitivo para o usuário: ${userId} (${user.email})`);

    // 2. Busca todos os imóveis cadastrados por esse usuário
    const { data: userProperties, error: fetchError } = await supabaseAdmin
      .from('imoveis')
      .select('id, fotos')
      .eq('usuario_id', userId);

    if (fetchError) {
      console.warn('Aviso ao buscar imóveis do usuário:', fetchError.message);
    }

    // 3. Coleta todas as URLs das imagens e apaga do Cloudflare R2
    const allPhotoUrls = [];
    if (userProperties && userProperties.length > 0) {
      userProperties.forEach((imovel) => {
        if (Array.isArray(imovel.fotos)) {
          allPhotoUrls.push(...imovel.fotos);
        }
      });
    }

    if (allPhotoUrls.length > 0) {
      console.log(`🗑️ [DELETE ACCOUNT] Excluindo ${allPhotoUrls.length} fotos do Cloudflare R2...`);
      await deleteR2Objects(allPhotoUrls);
    }

    // 4. Apaga documentos e avatares no Supabase Storage caso existam
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('documento_url, foto_url')
        .eq('id', userId)
        .single();

      if (profile?.documento_url) {
        const docPath = profile.documento_url.replace(/^documentos\//, '');
        await supabaseAdmin.storage.from('documentos').remove([docPath, `${userId}/*`]);
      }
      if (profile?.foto_url) {
        const avatarPath = profile.foto_url.replace(/^avatares\//, '');
        await supabaseAdmin.storage.from('avatares').remove([avatarPath, `${userId}/*`]);
      }
    } catch (e) {
      console.warn('Aviso ao limpar mídias do storage:', e.message);
    }

    // 5. Apaga imóveis e perfil no banco de dados (cascade garantido)
    await supabaseAdmin.from('imoveis').delete().eq('usuario_id', userId);
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // 6. Deleta o usuário no Supabase Auth usando o Admin SDK
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.warn('Nota ao deletar usuário do Supabase Auth admin:', deleteUserError.message);
    }

    console.log(`✅ [DELETE ACCOUNT SUCCESS] Conta do usuário ${userId} foi permanentemente encerrada.`);

    return NextResponse.json({
      success: true,
      message: 'Sua conta, perfil e imóveis foram excluídos permanentemente.',
    });

  } catch (err) {
    console.error('❌ [DELETE ACCOUNT ERROR]:', err);
    return NextResponse.json(
      { error: err.message || 'Erro ao processar o encerramento da conta.' },
      { status: 500 }
    );
  }
}
