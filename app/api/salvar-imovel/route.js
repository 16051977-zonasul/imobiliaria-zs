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
      condominio,
      iptu,
      bairro, 
      quartos, 
      banheiros, 
      vagas, 
      area_m2, 
      fotos,
      usuario_id
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

    const payload = {
      titulo,
      descricao: descricao || '',
      tipo: tipo || 'Apartamento',
      transacao: transacao || 'Vender',
      preco: parseFloat(preco),
      condominio: condominio ? parseFloat(condominio) : 0,
      iptu: iptu ? parseFloat(iptu) : 0,
      bairro: bairro || 'Zona Sul',
      quartos: parseInt(quartos, 10) || 0,
      banheiros: parseInt(banheiros, 10) || 0,
      vagas: parseInt(vagas, 10) || 0,
      area_m2: parseFloat(area_m2) || 0,
      fotos: cleanFotos,
      ...(usuario_id ? { usuario_id } : {})
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
