import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Garante execução totalmente dinâmica na Vercel sem cache estático
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || 'placeholder-key'
);

const resendApiKey = process.env.RESEND_API_KEY;

// Suporte a requisições GET para teste de rota e verificação de status
export async function GET(request) {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/webhooks/approve',
    service: 'Imóveis Zona Sul - Approve Webhook',
    timestamp: new Date().toISOString()
  });
}

// Suporte a preflight CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// Manipulador principal do evento Webhook via POST
export async function POST(request) {
  try {
    if (!resendApiKey) {
      console.error("[ERRO CRÍTICO] RESEND_API_KEY não foi configurada nas variáveis de ambiente!");
      return NextResponse.json(
        { error: 'Chave RESEND_API_KEY não configurada no servidor.' },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    const body = await request.json();
    console.log('📩 [WEBHOOK APPROVE RECEIVED]:', JSON.stringify(body, null, 2));

    // Supabase DB Webhook envia os dados dentro de body.record e body.old_record
    const record = body.record || body.new || body;
    const oldRecord = body.old_record || body.old || {};

    if (!record) {
      return NextResponse.json({ error: 'Payload do Webhook inválido ou sem registro.' }, { status: 400 });
    }

    const userId = record.id || record.user_id;
    const novoStatus = record.status_verificacao || record.status;
    const statusAntigo = oldRecord.status_verificacao || oldRecord.status;

    console.log(`🔍 [WEBHOOK APPROVE CHECK] User ID: ${userId} | Novo Status: ${novoStatus} | Status Antigo: ${statusAntigo}`);

    // Dispara a aprovação apenas quando status_verificacao mudar para 'aprovado'
    if (novoStatus !== 'aprovado') {
      return NextResponse.json({ 
        message: `Status atual é '${novoStatus}'. O e-mail só é enviado quando for 'aprovado'.`, 
        ignored: true 
      });
    }

    // Se o status já era aprovado anteriormente e não mudou agora, evita reenvios duplicados
    if (statusAntigo === 'aprovado') {
      return NextResponse.json({ 
        message: 'Status já constava como aprovado anteriormente. E-mail não duplicado.', 
        ignored: true 
      });
    }

    // 1. Busca o e-mail do usuário no Supabase Auth usando o Admin SDK
    let userEmail = record.email;
    let nomeAnunciante = record.nome_completo || 'Anunciante';

    if (!userEmail && userId) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userData?.user?.email) {
          userEmail = userData.user.email;
          console.log(`📧 [WEBHOOK APPROVE] E-mail recuperado via Supabase Auth: ${userEmail}`);
        }
      } catch (authErr) {
        console.warn('Aviso ao buscar e-mail via Auth:', authErr.message);
      }
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'E-mail do anunciante não localizado.' }, { status: 404 });
    }

    // 2. Dispara e-mail de confirmação via Resend API
    console.log(`📧 [RESEND EMAIL DISPATCH] Enviando e-mail de aprovação para: ${userEmail}...`);

    const emailResponse = await resend.emails.send({
      from: 'Imóveis Zona Sul <onboarding@resend.dev>',
      to: [userEmail],
      subject: '🎉 Seu Perfil de Anunciante Foi Aprovado! - Imóveis Zona Sul Rio de Janeiro',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #090d16; color: #e2e8f0; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 20px; border: 1px solid #1e293b; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
            .header { text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 24px; margin-bottom: 24px; }
            .title { color: #38bdf8; font-size: 24px; font-weight: 800; margin: 0; }
            .subtitle { color: #94a3b8; font-size: 13px; margin-top: 4px; }
            .badge { display: inline-block; background-color: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 9999px; padding: 6px 16px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
            .content { font-size: 15px; line-height: 1.6; color: #cbd5e1; }
            .highlight-box { background-color: #020617; border: 1px solid #1e293b; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: left; }
            .btn { display: block; width: 100%; text-align: center; background: linear-gradient(to right, #0284c7, #4f46e5); color: #ffffff; text-decoration: none; font-weight: 800; padding: 16px 0; border-radius: 14px; margin-top: 24px; font-size: 14px; shadow: 0 10px 15px -3px rgba(14, 165, 233, 0.3); }
            .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="badge">✓ PERFIL VERIFICADO & APROVADO</span>
              <h1 class="title">Parabéns, ${nomeAnunciante}!</h1>
              <p class="subtitle">Imóveis Zona Sul Rio de Janeiro</p>
            </div>

            <div class="content">
              <p>É com grande satisfação que informamos que o seu perfil de anunciante foi <strong>aprovado pela nossa equipe de segurança</strong>.</p>
              
              <div class="highlight-box">
                <p style="margin:0; font-size:13px; color:#94a3b8;"><strong>Status Atual:</strong> <span style="color:#34d399; font-weight:bold;">Aprovado</span></p>
                <p style="margin:8px 0 0 0; font-size:13px; color:#94a3b8;"><strong>Permissões Liberadas:</strong> Cadastro, edição e gerenciamento de imóveis na Zona Sul do Rio de Janeiro.</p>
              </div>

              <p>Agora você já pode publicar seus imóveis no nosso catálogo de alto padrão. Todas as fotos serão otimizadas automaticamente e enviadas ao nosso sistema.</p>

              <a href="https://imoveiszonasul.com.br/admin" class="btn">Acessar Painel & Publicar Imóvel</a>
            </div>

            <div class="footer">
              <p>Este é um e-mail automático enviado pelo sistema de verificação do Imóveis Zona Sul Rio de Janeiro.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('✅ [RESEND EMAIL SUCCESS]:', emailResponse);

    return NextResponse.json({
      success: true,
      message: `E-mail de aprovação enviado com sucesso para ${userEmail}.`,
      resendId: emailResponse.data?.id || null
    });

  } catch (err) {
    console.error('❌ [WEBHOOK APPROVE ERROR]:', err);
    return NextResponse.json({ error: err.message || 'Erro ao processar o webhook de aprovação.' }, { status: 500 });
  }
}
