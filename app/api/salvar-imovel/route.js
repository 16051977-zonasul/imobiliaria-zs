import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      id,
      usuario_id,
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
      ativo,
      mode // 'full' or 'patch-photos'
    } = body;

    // Modo: Patch de fotos apenas
    if (mode === 'patch-photos' && id) {
      const { data, error } = await supabase
        .from('imoveis')
        .update({ fotos })
        .eq('id', id)
        .select();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, imovel: data[0] });
    }

    // Validação de campos essenciais para inserção completa
    if (!titulo || !preco) {
      return NextResponse.json(
        { error: 'Título e Preço são campos obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanFotos = (Array.isArray(fotos) ? fotos : []).filter(
      (url) => typeof url === 'string' && url.length > 0 && !url.startsWith('blob:') && !url.startsWith('data:')
    );

    const payload = {
      usuario_id,
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

    let resultData;
    if (id) {
      const { data, error } = await supabase
        .from('imoveis')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      resultData = data && data.length > 0 ? data[0] : { id, ...payload };
    } else {
      const { data, error } = await supabase
        .from('imoveis')
        .insert([payload])
        .select();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      resultData = data && data.length > 0 ? data[0] : payload;
    }

    return NextResponse.json({ success: true, imovel: resultData });

  } catch (error) {
    console.error('Erro na Rota /api/salvar-imovel:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao salvar imóvel.' },
      { status: 500 }
    );
  }
}
