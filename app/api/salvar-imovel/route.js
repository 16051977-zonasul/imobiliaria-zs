import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      titulo, 
      descricao, 
      tipo, 
      transacao, 
      preco, 
      preco_mensal_temporada,
      condominio,
      iptu,
      bairro, 
      quartos, 
      banheiros, 
      vagas, 
      area_m2, 
      fotos,
      destaque,
      ativo
    } = body;

    // Validação de campos essenciais
    if (!titulo || !preco) {
      return NextResponse.json(
        { error: 'Título e Preço são campos obrigatórios.' },
        { status: 400 }
      );
    }

    // Trava de Sanitização Estrita: Filtra e remove qualquer URL temporária blob: ou data:
    const cleanFotos = (Array.isArray(fotos) ? fotos : []).filter(
      (url) => typeof url === 'string' && url.length > 0 && !url.startsWith('blob:') && !url.startsWith('data:')
    );

    console.log(`🔒 [SALVAR IMOVEL] Fotos sanitizadas enviadas para o Supabase (${cleanFotos.length}):`, cleanFotos);

    // Payload estritamente adaptado às colunas válidas da tabela imoveis (sem usuario_id)
    const payload = {
      titulo,
      descricao: descricao || '',
      tipo: tipo || 'Apartamento',
      transacao: transacao || 'Vender',
      preco: parseFloat(preco),
      ...(preco_mensal_temporada ? { preco_mensal_temporada: parseFloat(preco_mensal_temporada) } : {}),
      condominio: condominio ? parseFloat(condominio) : 0,
      iptu: iptu ? parseFloat(iptu) : 0,
      bairro: bairro || 'Zona Sul',
      quartos: parseInt(quartos, 10) || 0,
      banheiros: parseInt(banheiros, 10) || 0,
      vagas: parseInt(vagas, 10) || 0,
      area_m2: parseFloat(area_m2) || 0,
      fotos: cleanFotos,
      ...(typeof destaque === 'boolean' ? { destaque } : {}),
      ...(typeof ativo === 'boolean' ? { ativo } : {})
    };

    const { data, error } = await supabase
      .from('imoveis')
      .insert([payload])
      .select();

    if (error) {
      console.error('Erro no Supabase ao salvar imóvel:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      imovel: data && data.length > 0 ? data[0] : payload 
    });

  } catch (error) {
    console.error('Erro na Rota /api/salvar-imovel:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao salvar imóvel.' },
      { status: 500 }
    );
  }
}
