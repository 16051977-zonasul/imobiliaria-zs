import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || 'placeholder-key'
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { profile_id, cpf, nome_completo, data_nascimento, filiacao, documento_url } = body;

    console.log('🔍 [API VERIFY-DOCUMENT] Recebido pedido de validação:', {
      profile_id,
      cpf,
      nome_completo,
      data_nascimento,
      filiacao,
      documento_url,
    });

    if (!profile_id || !documento_url) {
      return NextResponse.json(
        { error: 'Parâmetros profile_id e documento_url são obrigatórios.' },
        { status: 400 }
      );
    }

    // 1. Obter a imagem do documento e converter para Base64
    let base64Image = '';
    let mimeType = 'image/jpeg';

    try {
      if (documento_url.startsWith('data:')) {
        // Trata Data URL base64 diretamente
        const parts = documento_url.split(',');
        const mimeMatch = parts[0].match(/data:(.*?);/);
        if (mimeMatch) mimeType = mimeMatch[1];
        base64Image = parts[1] || '';
      } else {
        let fetchUrl = documento_url;

        // Se a URL não for HTTP/HTTPS (ex: caminho de bucket como "userId/filename")
        if (!documento_url.startsWith('http://') && !documento_url.startsWith('https://')) {
          const { data: signedData } = await supabaseAdmin.storage
            .from('documentos')
            .createSignedUrl(documento_url, 300);
          if (signedData?.signedUrl) {
            fetchUrl = signedData.signedUrl;
          } else {
            const { data: publicData } = supabaseAdmin.storage
              .from('documentos')
              .getPublicUrl(documento_url);
            fetchUrl = publicData?.publicUrl || documento_url;
          }
        }

        console.log('📥 [API VERIFY-DOCUMENT] Baixando imagem do documento para análise Vision:', fetchUrl);
        const imgRes = await fetch(fetchUrl);
        if (!imgRes.ok) {
          throw new Error(`Falha ao baixar imagem do documento. Status HTTP ${imgRes.status}`);
        }

        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
        if (contentType.includes('png')) mimeType = 'image/png';
        else if (contentType.includes('webp')) mimeType = 'image/webp';

        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        base64Image = buffer.toString('base64');
      }
    } catch (downloadErr) {
      console.error('❌ [API VERIFY-DOCUMENT] Erro ao obter imagem do documento:', downloadErr);

      await supabaseAdmin
        .from('profiles')
        .update({
          status_verificacao: 'recusado',
          motivo_recusa: `Erro ao obter imagem do documento: ${downloadErr.message}`,
        })
        .eq('id', profile_id);

      return NextResponse.json(
        { success: false, status: 'recusado', motivo: 'Erro ao obter imagem do documento para análise.' },
        { status: 400 }
      );
    }

    // 2. Chamada ao modelo gpt-4o com a imagem para extração de dados
    console.log('🤖 [API VERIFY-DOCUMENT] Enviando imagem ao gpt-4o para extração em JSON...');

    const prompt = `Analise a imagem deste documento oficial de identificação brasileiro (RG, CNH, Passaporte ou similar).
Extraia rigorosamente os seguintes 4 dados:
1. nome_extraido: Nome completo da pessoa titular do documento.
2. cpf_extraido: Número do CPF da pessoa (apenas dígitos ou formatado).
3. data_nascimento_extraida: Data de nascimento (no formato DD/MM/AAAA ou AAAA-MM-DD).
4. filiacao_extraida: Nome completo da mãe ou do pai listado na filiação do documento.

Responda ESTRITAMENTE em formato JSON estruturado assim:
{
  "nome_extraido": "...",
  "cpf_extraido": "...",
  "data_nascimento_extraida": "...",
  "filiacao_extraida": "..."
}
Se algum dado estiver ausente ou ilegível no documento, preencha o valor como null.`;

    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    const finishReason = completion.choices[0]?.finish_reason;
    const responseContent = completion.choices[0]?.message?.content;
    console.log('🤖 [API VERIFY-DOCUMENT] Resposta recebida da OpenAI (finish_reason:', finishReason, '):', responseContent);

    // Se o modelo não gerou conteúdo (imagem recusada, moderação, etc.)
    if (!responseContent) {
      console.error('❌ [API VERIFY-DOCUMENT] OpenAI retornou resposta vazia. finish_reason:', finishReason);
      await supabaseAdmin
        .from('profiles')
        .update({
          status_verificacao: 'recusado',
          motivo_recusa: 'A imagem enviada não pôde ser processada pelo sistema de verificação. Envie uma foto nítida do documento.',
        })
        .eq('id', profile_id);

      return NextResponse.json(
        {
          success: false,
          status: 'recusado',
          motivo: 'A imagem enviada não pôde ser processada. Envie uma foto nítida do documento (CNH ou RG).',
        },
        { status: 422 }
      );
    }

    let extracted = {};
    try {
      // Extrai JSON de blocos markdown ```json ... ``` ou diretamente
      const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                        responseContent.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseContent;
      extracted = JSON.parse(jsonStr.trim());
    } catch (parseErr) {
      console.error('❌ [API VERIFY-DOCUMENT] Erro ao parsear JSON da OpenAI:', parseErr, '| Conteúdo bruto:', responseContent);
    }

    const {
      nome_extraido,
      cpf_extraido,
      data_nascimento_extraida,
      filiacao_extraida,
    } = extracted;

    // 3. Comparação dos 4 dados digitados vs extraídos
    const cleanDigits = (val) => String(val || '').replace(/\D/g, '');
    const cleanText = (val) =>
      String(val || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();

    const inputCPF = cleanDigits(cpf);
    const docCPF = cleanDigits(cpf_extraido);

    const inputNome = cleanText(nome_completo);
    const docNome = cleanText(nome_extraido);

    const inputDataNasc = cleanDigits(data_nascimento);
    const docDataNasc = cleanDigits(data_nascimento_extraida);

    const inputFiliacao = cleanText(filiacao);
    const docFiliacao = cleanText(filiacao_extraida);

    console.log('📊 [API VERIFY-DOCUMENT] Comparativo de dados:', {
      cpf: { input: inputCPF, doc: docCPF },
      nome: { input: inputNome, doc: docNome },
      data_nascimento: { input: inputDataNasc, doc: docDataNasc },
      filiacao: { input: inputFiliacao, doc: docFiliacao },
    });

    const divergencias = [];

    // Validar CPF (se leu CPF e não bate)
    if (!docCPF) {
      divergencias.push('CPF não identificado com clareza no documento enviado.');
    } else if (inputCPF !== docCPF) {
      divergencias.push(`CPF digitado (${cpf}) difere do documento (${cpf_extraido}).`);
    }

    // Validar Nome Completo
    if (!docNome) {
      divergencias.push('Nome completo não identificado no documento.');
    } else {
      const inputWords = inputNome.split(' ').filter((w) => w.length > 2);
      const docWords = docNome.split(' ').filter((w) => w.length > 2);
      const matchedWords = inputWords.filter((w) => docWords.includes(w));

      if (matchedWords.length < Math.min(2, inputWords.length)) {
        divergencias.push(`Nome digitado (${nome_completo}) não confere com o documento (${nome_extraido}).`);
      }
    }

    // Validar Data de Nascimento
    if (!docDataNasc) {
      divergencias.push('Data de nascimento não identificada no documento.');
    } else if (inputDataNasc !== docDataNasc) {
      divergencias.push(`Data de nascimento (${data_nascimento}) difere do documento (${data_nascimento_extraida}).`);
    }

    // Validar Filiação (Nome da Mãe / Pai)
    if (!docFiliacao) {
      divergencias.push('Filiação (nome da mãe/pai) não identificada no documento.');
    } else {
      const inputFilWords = inputFiliacao.split(' ').filter((w) => w.length > 2);
      const docFilWords = docFiliacao.split(' ').filter((w) => w.length > 2);
      const matchedFil = inputFilWords.filter((w) => docFilWords.includes(w));

      if (matchedFil.length < Math.min(2, inputFilWords.length)) {
        divergencias.push(`Filiação digitada (${filiacao}) não confere com o documento (${filiacao_extraida}).`);
      }
    }

    const aprovado = divergencias.length === 0;

    // 4. Atualizar no Supabase via Service Role Client
    if (aprovado) {
      console.log('🎉 [API VERIFY-DOCUMENT] Documento APROVADO! Atualizando perfil no Supabase...');
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          status_verificacao: 'aprovado',
          motivo_recusa: null,
        })
        .eq('id', profile_id);

      if (updateError) {
        console.error('❌ [API VERIFY-DOCUMENT] Erro ao atualizar status para aprovado:', updateError);
      }

      return NextResponse.json({
        success: true,
        status: 'aprovado',
        extracted: {
          nome_extraido,
          cpf_extraido,
          data_nascimento_extraida,
          filiacao_extraida,
        },
      });
    } else {
      const motivo = divergencias.join(' ');
      console.warn('⚠️ [API VERIFY-DOCUMENT] Documento RECUSADO. Motivos:', motivo);

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          status_verificacao: 'recusado',
          motivo_recusa: motivo,
        })
        .eq('id', profile_id);

      if (updateError) {
        console.error('❌ [API VERIFY-DOCUMENT] Erro ao atualizar status para recusado:', updateError);
      }

      return NextResponse.json({
        success: false,
        status: 'recusado',
        motivo,
        extracted: {
          nome_extraido,
          cpf_extraido,
          data_nascimento_extraida,
          filiacao_extraida,
        },
      });
    }
  } catch (err) {
    console.error('❌ [API VERIFY-DOCUMENT CRITICAL ERROR]:', err);
    return NextResponse.json(
      { error: err.message || 'Erro inesperado na verificação de documento.' },
      { status: 500 }
    );
  }
}
