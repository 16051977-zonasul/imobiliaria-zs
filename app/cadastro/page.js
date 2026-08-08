'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  ShieldCheck,
  FileCheck,
  Clock,
  Calendar,
  Users
} from 'lucide-react';

export default function CadastroPage() {
  const [formData, setFormData] = useState({
    nome_completo: '',
    telefone: '',
    email: '',
    senha: '',
    cpf: '',
    data_nascimento: '',
    filiacao: '',
  });

  const [documentoFile, setDocumentoFile] = useState(null);
  const [documentoPreview, setDocumentoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Formata Telefone: (21) 99999-9999
  function formatTelefone(val) {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 2) return nums ? `(${nums}` : '';
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  }

  // Formata CPF: 000.000.000-00
  function formatCPF(val) {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
    if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
  }

  // Formata Data de Nascimento para exibição: DD/MM/AAAA
  function formatDataNascimento(val) {
    const nums = val.replace(/\D/g, '').slice(0, 8);
    if (nums.length <= 2) return nums;
    if (nums.length <= 4) return `${nums.slice(0, 2)}/${nums.slice(2)}`;
    return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4)}`;
  }

  // Converte data de exibição (DD/MM/AAAA) ou ISO (YYYY-MM-DD) → sempre YYYY-MM-DD
  function toISODate(val) {
    if (!val) return null;
    const s = String(val).trim();
    // Já está no formato ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // Formato brasileiro DD/MM/AAAA
    const parts = s.split('/');
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return null;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'telefone') {
      setFormData((prev) => ({ ...prev, telefone: formatTelefone(value) }));
    } else if (name === 'cpf') {
      setFormData((prev) => ({ ...prev, cpf: formatCPF(value) }));
    } else if (name === 'data_nascimento') {
      setFormData((prev) => ({ ...prev, data_nascimento: formatDataNascimento(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Formato inválido! Envie uma foto ou imagem legível da sua CNH ou RG (PNG, JPG ou WEBP). Arquivos PDF não são aceitos para verificação automática.');
      setDocumentoFile(null);
      setDocumentoPreview(null);
      e.target.value = '';
      return;
    }

    setErrorMessage('');
    setDocumentoFile(file);
    setDocumentoPreview(URL.createObjectURL(file));
  }

  async function handleCadastro(e) {
    e.preventDefault();
    setErrorMessage('');

    // ─── DIAGNÓSTICO: validações de front-end ────────────────────────────────
    const payload = {
      nome_completo: formData.nome_completo,
      email: formData.email,
      telefone: formData.telefone,
      cpf: formData.cpf,
      data_nascimento: formData.data_nascimento,
      filiacao: formData.filiacao,
      senhaLength: formData.senha?.length,
      documentoFile: documentoFile?.name ?? null,
    };
    console.log('--- CADASTRO INICIADO ---', payload);
    // ─────────────────────────────────────────────────────────────────────────

    if (!formData.nome_completo || !formData.email || !formData.senha || !formData.cpf || !formData.data_nascimento || !formData.filiacao) {
      console.warn('[DIAGNÓSTICO] Bloqueado pela validação: campos obrigatórios ausentes');
      setErrorMessage('Preencha todos os campos obrigatórios (incluindo Data de Nascimento e Filiação).');
      return;
    }

    if (!documentoFile) {
      console.warn('[DIAGNÓSTICO] Bloqueado pela validação: nenhum arquivo de documento selecionado');
      setErrorMessage('É obrigatório enviar a foto do documento (RG ou CNH) para validação de segurança.');
      return;
    }

    if (formData.senha.length < 6) {
      console.warn('[DIAGNÓSTICO] Bloqueado pela validação: senha com menos de 6 caracteres');
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload da foto do documento para o bucket ANTES de criar qualquer conta
      let documentoUrl = '';
      console.log(`📤 [STORAGE UPLOAD] Enviando foto do documento para o bucket antes de criar conta...`);

      const docFormData = new FormData();
      docFormData.append('file', documentoFile);
      docFormData.append('userId', 'temp_' + Date.now());

      const uploadRes = await fetch('/api/upload-documento', {
        method: 'POST',
        body: docFormData,
      });

      const uploadJson = await uploadRes.json();
      if (uploadRes.ok && uploadJson.documentoUrl) {
        documentoUrl = uploadJson.documentoUrl;
        console.log('✅ [STORAGE API SUCCESS] Documento salvo para análise:', documentoUrl);
      } else {
        throw new Error(`upload_documento: ${uploadJson.error || 'Erro ao enviar a foto do documento.'}`);
      }

      // 2. Validação do documento com a OpenAI Vision (gpt-4o) ANTES da criação de conta
      console.log('🤖 [VERIFY DOCUMENT] Disparando validação via OpenAI Vision antes de criar a conta...');
      
      const verifyRes = await fetch('/api/auth/verify-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          cpf: formData.cpf,
          nome_completo: formData.nome_completo,
          data_nascimento: formData.data_nascimento,
          filiacao: formData.filiacao,
          documento_url: documentoUrl,
        }),
      });

      const verifyJson = await verifyRes.json();
      console.log('🤖 [VERIFY DOCUMENT RESULT] Resultado da análise IA:', verifyJson);

      // 3. Se a validação RETORNAR REJEITADA:
      if (!verifyRes.ok || verifyJson.status === 'rejeitado' || verifyJson.success === false) {
        const motivoRecusa = verifyJson.motivo || 'Os dados contidos no documento não conferem com as informações digitadas.';
        console.warn('⚠️ [CADASTRO BLOQUEADO] Documento rejeitado pela IA. Motivo:', motivoRecusa);
        
        // Exibe mensagem de erro genérica na interface (sem expor dados extraídos)
        setErrorMessage('Os dados preenchidos divergem dos dados contidos no documento enviado. Por favor, verifique as informações e refaça a inscrição com os dados corretos.');
        setLoading(false);
        return;
      }

      // 4. Se a validação RETORNAR APROVADA: Executa o supabase.auth.signUp() normalmente
      console.log('🚀 [SUBMIT CADASTRO] Documento APROVADO! Criando conta no Supabase Auth para:', formData.email);

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://imoveis.zonasulriodejaneiro.com.br';
      const redirectUrl = `${origin}/api/auth/callback?next=/perfil`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome_completo: formData.nome_completo,
            telefone: formData.telefone,
            cpf: formData.cpf,
            data_nascimento: formData.data_nascimento,
            filiacao: formData.filiacao,
          }
        }
      });

      if (authError) {
        console.error('❌ [SUPABASE AUTH ERROR]:', authError.status, authError.code, authError.message);
        if (authError.message.includes('User already registered') || authError.message.includes('already registered')) {
          throw new Error('Erro ao criar sua conta no nosso sistema: este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.');
        }
        throw new Error('Erro ao processar seu cadastro no nosso sistema. Tente novamente.');
      }

      let user = authData?.user;
      if (!user) {
        console.error('❌ [SUPABASE AUTH ERROR]: Nenhum usuário retornado pelo Auth.');
        throw new Error('Não foi possível obter os dados do usuário cadastrado. Tente novamente.');
      }

      console.log('✅ [SUPABASE AUTH SUCCESS] Usuário criado com sucesso. UUID:', user.id);

      // 5. Inserção na tabela public.profiles com status_verificacao = 'aprovado'
      const dataNascimentoISO = toISODate(formData.data_nascimento);

      const profilePayload = {
        id: user.id,
        nome_completo: formData.nome_completo,
        telefone: formData.telefone,
        cpf: formData.cpf,
        data_nascimento: dataNascimentoISO,
        filiacao: formData.filiacao,
        documento_url: documentoUrl,
        status_verificacao: 'aprovado',
      };

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([profilePayload])
        .select();

      if (profileError) {
        console.error('❌ [DATABASE PROFILE ERROR]:', profileError);
        if (profileError.code === '23503') {
          throw new Error('Este e-mail já está cadastrado no sistema. Por favor, vá para a tela de Login e acesse seu perfil.');
        }
        throw new Error(`Erro ao salvar perfil no nosso sistema. Tente novamente. (${profileError.code || 'DB'})`);
      }
      console.log('🎉 [PROFILES INSERT SUCCESS] Registro de perfil gravado com sucesso:', profileData);

      // 6. Exibe a mensagem de sucesso — o formulário soma e só a mensagem de confirmação de e-mail aparece
      setSuccess(true);

    } catch (err) {
      console.error('❌ [ERRO CRÍTICO NO NOVO CADASTRO]:', err);
      if (
        err.message.includes('upload_documento') ||
        err.message.toLowerCase().includes('storage') ||
        err.message.toLowerCase().includes('bucket')
      ) {
        setErrorMessage('Erro ao enviar a foto do documento. Verifique se o arquivo é uma imagem válida (JPG, PNG ou WEBP) e tente novamente.');
      } else {
        setErrorMessage(err.message || 'Ocorreu um erro ao processar seu cadastro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-xl w-full space-y-8">
        
        {/* Header Back Link */}
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Catálogo
          </Link>

          {/* Logo & Title */}
          <div className="text-center">
            <div className="inline-flex w-14 h-14 rounded-2xl gradient-bg items-center justify-center shadow-xl shadow-sky-500/20 mb-4">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Cadastro de Anunciante</h1>
            <p className="mt-2 text-xs text-slate-400 max-w-md mx-auto">
              Preencha os dados e envie seu documento para publicar seus imóveis na Zona Sul do Rio de Janeiro
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">

          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="flex items-start gap-3 bg-rose-950/50 border border-rose-500/30 text-rose-200 p-4 rounded-2xl mb-6 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mensagem de SUCESSO — formulário fica oculto */}
          {success ? (
            <div className="rounded-2xl bg-emerald-950/50 p-6 border-2 border-emerald-500/30 shadow-xl shadow-emerald-500/10 space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-400 font-black text-base border-b border-emerald-500/20 pb-4">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <span>Cadastro realizado com sucesso!</span>
              </div>

              <div className="text-sm text-slate-200 space-y-3">
                <p>
                  <strong className="text-white">Passo 1 (Importante):</strong> Enviamos um e-mail de confirmação para{' '}
                  <strong className="text-sky-300">{formData.email}</strong>.{' '}
                  <strong>Clique no link presente nesse e-mail para ativar sua conta.</strong>
                </p>
                <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                  ⚠️ Caso não encontre na caixa de entrada, verifique sua pasta de{' '}
                  <strong>Spam / Lixo Eletrônico</strong>.
                </p>
                <hr className="border-emerald-500/20" />
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Passo 2:</strong> Seus dados e documentos já foram recebidos. A conta está com o status{' '}
                  <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold tracking-wide text-xs">PENDENTE</span>{' '}
                  e aguarda a verificação da equipe do{' '}
                  <strong>Imóveis Zona Sul Rio de Janeiro</strong> para liberação de anúncios.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300 underline underline-offset-4 transition-colors"
                >
                  Já confirmei meu e-mail → Fazer Login
                </Link>
              </div>
            </div>
          ) : (
          <form onSubmit={handleCadastro} className="space-y-5">
            
            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Nome Completo *
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  name="nome_completo"
                  value={formData.nome_completo}
                  onChange={handleChange}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  required
                />
              </div>
            </div>

            {/* E-mail e Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  E-mail *
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Telefone / WhatsApp *
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(21) 99999-9999"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Senha e CPF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Senha de Acesso *
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none" />
                  <input
                    type="password"
                    name="senha"
                    value={formData.senha}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  CPF do Anunciante *
                </label>
                <div className="relative flex items-center">
                  <FileText className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Data de Nascimento e Filiação (Nome da Mãe/Pai) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Data de Nascimento *
                </label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    name="data_nascimento"
                    value={formData.data_nascimento}
                    onChange={handleChange}
                    placeholder="DD/MM/AAAA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Nome da Mãe ou do Pai (Filiação) *
                </label>
                <div className="relative flex items-center">
                  <Users className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    name="filiacao"
                    value={formData.filiacao}
                    onChange={handleChange}
                    placeholder="Nome completo conforme documento"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Upload do Documento (RG / CNH) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>Foto do Documento (RG ou CNH) *</span>
                <span className="text-[10px] text-sky-400 font-normal">Privado e Seguro</span>
              </label>

              <div className="relative border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 text-center bg-slate-950/50 transition-colors group cursor-pointer">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  {documentoFile ? (
                    <FileCheck className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-sky-400 transition-colors" />
                  )}
                  
                  {documentoFile ? (
                    <span className="text-xs font-bold text-emerald-400">
                      Foto selecionada: {documentoFile.name}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-300">
                      Clique para selecionar a foto da sua CNH ou RG (PNG, JPG ou WEBP)
                    </span>
                  )}

                  <span className="text-[11px] text-slate-500">
                    Apenas fotos/imagens de documentos (PNG, JPG ou WEBP). PDFs não são aceitos.
                  </span>
                </div>
              </div>

              {/* Preview da Imagem */}
              {documentoPreview && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
                    <img src={documentoPreview} alt="Preview do documento" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs text-slate-300">
                    <p className="font-semibold text-white">Documento anexado</p>
                    <p className="text-[11px] text-slate-400">Tamanho: {(documentoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Criando sua conta, aguarde...</span>
                </>
              ) : (
                <>
                  <Building2 className="w-5 h-5" />
                  <span>Criar Conta de Anunciante</span>
                </>
              )}
            </button>

          </form>
          )} {/* fim do bloco success ? ... : <form> */}

          {/* Login Redirection Footer — exibido sempre */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Já possui conta cadastrada?{' '}
              <Link 
                href="/login" 
                className="text-sky-400 hover:text-sky-300 font-bold underline underline-offset-4"
              >
                Fazer Login
              </Link>
            </p>
          </div>

        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verificação de identidade obrigatória para segurança do catálogo</span>
        </div>

      </div>
    </div>
  );
}
