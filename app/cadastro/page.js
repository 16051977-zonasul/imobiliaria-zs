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
  Clock
} from 'lucide-react';

export default function CadastroPage() {
  const [formData, setFormData] = useState({
    nome_completo: '',
    telefone: '',
    email: '',
    senha: '',
    cpf: '',
  });

  const [documentoFile, setDocumentoFile] = useState(null);
  const [documentoPreview, setDocumentoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

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

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'telefone') {
      setFormData((prev) => ({ ...prev, telefone: formatTelefone(value) }));
    } else if (name === 'cpf') {
      setFormData((prev) => ({ ...prev, cpf: formatCPF(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocumentoFile(file);
    setDocumentoPreview(URL.createObjectURL(file));
  }

  async function handleCadastro(e) {
    e.preventDefault();
    setFeedback(null);

    if (!formData.nome_completo || !formData.email || !formData.senha || !formData.cpf) {
      setFeedback({ type: 'error', message: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    if (!documentoFile) {
      setFeedback({ type: 'error', message: 'É obrigatório enviar a foto do documento (RG ou CNH) para validação de segurança.' });
      return;
    }

    if (formData.senha.length < 6) {
      setFeedback({ type: 'error', message: 'A senha deve conter no mínimo 6 caracteres.' });
      return;
    }

    setLoading(true);
    setFeedback({ type: 'loading', message: 'Criando sua conta, aguarde...' });

    try {
      console.log('🚀 [SUBMIT CADASTRO] Iniciando fluxo de cadastro para:', formData.email);

      // 1. Cadastra o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          data: {
            nome_completo: formData.nome_completo,
            telefone: formData.telefone,
            cpf: formData.cpf,
          }
        }
      });

      if (authError) {
        console.error('❌ [SUPABASE AUTH ERROR]:', authError);
        throw new Error(`Erro ao criar conta no Supabase: ${authError.message}`);
      }

      let user = authData?.user;
      if (!user) {
        console.error('❌ [SUPABASE AUTH ERROR]: Nenhum usuário retornado pelo Auth.');
        throw new Error('Não foi possível obter o UUID do usuário cadastrado no Supabase Auth.');
      }

      console.log('✅ [SUPABASE AUTH SUCCESS] Usuário criado com sucesso. UUID:', user.id);

      // 2. Garante autenticação da sessão para passar pelas políticas RLS no Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.log('🔄 [AUTH SESSION] Efetuando login para obter Token de Acesso RLS...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.senha,
        });

        if (signInError) {
          console.warn('⚠️ [AUTH SIGN-IN NOTE]:', signInError.message);
        } else if (signInData?.user) {
          user = signInData.user;
        }
      }

      // 3. Upload da foto do documento para o bucket 'documentos' no Supabase Storage
      let documentoUrl = '';
      const fileExt = documentoFile.name.split('.').pop();
      const cleanFileName = documentoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${user.id}/${Date.now()}_${cleanFileName}`;

      console.log(`📤 [STORAGE UPLOAD] Enviando documento para bucket 'documentos', caminho: ${storagePath}`);

      const { data: storageData, error: storageError } = await supabase.storage
        .from('documentos')
        .upload(storagePath, documentoFile, {
          contentType: documentoFile.type || 'image/jpeg',
          upsert: true,
        });

      if (storageError) {
        console.warn('⚠️ [STORAGE CLIENT RLS NOTICE] Falha no upload via cliente, acionando rota API segura:', storageError.message);

        const docFormData = new FormData();
        docFormData.append('file', documentoFile);
        docFormData.append('userId', user.id);

        const uploadRes = await fetch('/api/upload-documento', {
          method: 'POST',
          body: docFormData,
        });

        const uploadJson = await uploadRes.json();
        if (uploadRes.ok && uploadJson.documentoUrl) {
          documentoUrl = uploadJson.documentoUrl;
          console.log('✅ [STORAGE API SUCCESS] Documento salvo via API:', documentoUrl);
        } else {
          console.error('❌ [STORAGE API ERROR]:', uploadJson.error);
          throw new Error(`Erro ao enviar documento para o Supabase Storage: ${uploadJson.error || storageError.message}`);
        }
      } else {
        console.log('✅ [STORAGE CLIENT SUCCESS] Upload concluído:', storageData);

        const { data: signedData } = await supabase.storage
          .from('documentos')
          .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

        if (signedData?.signedUrl) {
          documentoUrl = signedData.signedUrl;
        } else {
          const { data: publicData } = supabase.storage
            .from('documentos')
            .getPublicUrl(storagePath);
          documentoUrl = publicData?.publicUrl || storagePath;
        }
      }

      console.log('📎 [DOCUMENTO URL GENERATED]:', documentoUrl);

      // 4. Inserção na tabela public.profiles com status_verificacao explicitamente como 'pendente'
      console.log('💾 [DB PROFILE INSERT] Gravando registro em public.profiles para id:', user.id);

      const profilePayload = {
        id: user.id,
        nome_completo: formData.nome_completo,
        telefone: formData.telefone,
        cpf: formData.cpf,
        documento_url: documentoUrl,
        status_verificacao: 'pendente',
      };

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert([profilePayload])
        .select();

      if (profileError) {
        console.error('❌ [DATABASE PROFILE ERROR]:', profileError);
        throw new Error(`Erro ao salvar perfil no Supabase (profiles): ${profileError.message} (Código: ${profileError.code || 'RLS/DB'})`);
      }

      console.log('🎉 [PROFILES INSERT SUCCESS] Registro de perfil gravado com sucesso:', profileData);

      // 5. Exibe a mensagem de sucesso fixa sem nenhum redirecionamento automático
      setFeedback({ 
        type: 'success',
        title: 'Cadastro realizado com sucesso!',
        message: 'Seus dados e documentos foram recebidos. A sua conta está com o status PENDENTE e aguarda a aprovação da equipe do Imóveis Zona Sul Rio de Janeiro para liberação do acesso.' 
      });

    } catch (err) {
      console.error('❌ [ERRO CRÍTICO NO NOVO CADASTRO]:', err);
      setFeedback({ 
        type: 'error', 
        message: err.message || 'Erro ao realizar cadastro no Supabase. Verifique o console.' 
      });
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
          
          {feedback && (
            <div className={`p-5 rounded-2xl mb-6 text-sm font-medium transition-all ${
              feedback.type === 'success' 
                ? 'bg-emerald-950/50 border-2 border-emerald-500/50 text-emerald-300 shadow-2xl shadow-emerald-500/10' 
                : feedback.type === 'loading'
                  ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}>
              {feedback.type === 'success' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-400 font-black text-base border-b border-emerald-500/20 pb-3">
                    <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
                    <span>Cadastro realizado com sucesso!</span>
                  </div>
                  <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-normal">
                    Seus dados e documentos foram recebidos. A sua conta está com o status <strong className="text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 font-bold tracking-wide">PENDENTE</strong> e aguarda a aprovação da equipe do <strong>Imóveis Zona Sul Rio de Janeiro</strong> para liberação do acesso.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {feedback.type === 'loading'
                    ? <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                    : <AlertCircle className="w-5 h-5 shrink-0" />}
                  <span>{feedback.message}</span>
                </div>
              )}
            </div>
          )}

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
                  Telefone / WhatsApp
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

            {/* Upload do Documento (RG / CNH) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>Foto do Documento (RG ou CNH) *</span>
                <span className="text-[10px] text-sky-400 font-normal">Privado e Seguro</span>
              </label>

              <div className="relative border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 text-center bg-slate-950/50 transition-colors group cursor-pointer">
                <input
                  type="file"
                  accept="image/*,.pdf"
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
                      Documento selecionado: {documentoFile.name}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-300">
                      Clique para selecionar a foto da sua CNH ou RG
                    </span>
                  )}

                  <span className="text-[11px] text-slate-500">
                    Sua foto é enviada ao bucket privado 'documentos' para verificação de segurança
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

          {/* Login Redirection Footer */}
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
