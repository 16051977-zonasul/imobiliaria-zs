import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { 
      titulo, 
      descricao, 
      tipo, 
      transacao, 
      preco, 
      bairro, 
      quartos, 
      banheiros, 
      vagas, 
      area_m2, 
      fotos 
    } = req.body;

    // Validação simples dos dados essenciais
    if (!titulo || !preco) {
      return res.status(400).json({ error: 'Título e Preço são obrigatórios.' });
    }

    // Insere o registro na tabela "imoveis" do Supabase
    const { data, error } = await supabase
      .from('imoveis')
      .insert([
        {
          titulo,
          descricao,
          tipo,
          transacao,
          preco: parseFloat(preco),
          bairro,
          quartos: parseInt(quartos, 10) || 0,
          banheiros: parseInt(banheiros, 10) || 0,
          vagas: parseInt(vagas, 10) || 0,
          area_m2: parseFloat(area_m2) || 0,
          fotos // Array com as URLs públicas do R2 enviadas do frontend
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true, imovel: data[0] });

  } catch (error) {
    console.error('Erro em salvar-imovel.js:', error);
    return res.status(500).json({ error: error.message || 'Erro interno ao salvar imóvel' });
  }
}