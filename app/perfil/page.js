'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  User, 
  Phone, 
  Globe, 
  Award, 
  ShieldCheck, 
  Clock, 
  Camera, 
  Save, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  Calendar,
  Home,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  UserX,
  X,
  UploadCloud,
  FileCheck,
  RefreshCw,
  LogOut,
  XCircle
} from 'lucide-react';

export default function PerfilPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Estados de Exclusão de Conta
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Estados de Exclusão de Imóvel Específico
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [deletingProperty, setDeletingProperty] = useState(false);

  // User & Profile State
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    nome_completo: '',
    telefone: '',
    redes_sociais: '',
    tipo_anunciante: 'Sou Corretor(a)',
    creci: '',
    bio: '',
    foto_url: '',
    status_verificacao: 'pendente',
    motivo_recusa: '',
    cpf: '',
    data_nascimento: '',
    filiacao: '',
    created_at: new Date().toISOString()
  });

  // Estados de Reenvio de Documento Recusado
  const [reuploadFile, setReuploadFile] = useState(null);
  const [reuploadPreview, setReuploadPreview] = useState(null);
  const [reuploading, setReuploading] = useState(false);
  const [reuploadError, setReuploadError] = useState('');

  // Imóveis do Anunciante
  const [meusImoveis, setMeusImoveis] = useState([]);

  // Depoimentos / Avaliações
  const [avaliacoes, setAvaliacoes] = useState([
    {
      id: 1,
      cliente: 'Mariana Souza',
      data: '15 de Julho de 2026',
      nota: 5,
      comentario: 'Atendimento impecável! O processo de aluguel em Ipanema foi super transparente e rápido. Recomendo muito.'
    },
    {
      id: 2,
      cliente: 'Roberto & Ana Paula',
      data: '02 de Junho de 2026',
      nota: 5,
      comentario: 'Encontramos nossa cobertura no Leblon com total suporte jurídico e honestidade em todas as etapas.'
    }
  ]);

  useEffect(() => {
    carregarPerfilEImoveis();
  }, []);

  async function carregarPerfilEImoveis() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?redirectTo=/perfil');
        return;
      }
      setUser(user);

      // 1. Carrega dados do perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile({
          nome_completo: profileData.nome_completo || user.user_metadata?.nome_completo || '',
          telefone: profileData.telefone || user.user_metadata?.telefone || '',
          redes_sociais: profileData.redes_sociais || '',
          tipo_anunciante: profileData.tipo_anunciante || 'Sou Corretor(a)',
          creci: profileData.creci || '',
          bio: profileData.bio || '',
          foto_url: profileData.foto_url || '',
          status_verificacao: profileData.status_verificacao || 'pendente',
          motivo_recusa: profileData.motivo_recusa || '',
          cpf: profileData.cpf || user.user_metadata?.cpf || '',
          data_nascimento: profileData.data_nascimento || user.user_metadata?.data_nascimento || '',
          filiacao: profileData.filiacao || user.user_metadata?.filiacao || '',
          created_at: profileData.created_at || user.created_at || new Date().toISOString()
        });
      } else {
        setProfile((prev) => ({
          ...prev,
          nome_completo: user.user_metadata?.nome_completo || user.email || '',
          telefone: user.user_metadata?.telefone || '',
          cpf: user.user_metadata?.cpf || '',
          created_at: user.created_at || new Date().toISOString()
        }));
      }

      // 2. Carrega imóveis cadastrados no banco de dados Supabase
      const { data: imoveisData } = await supabase
        .from('imoveis')
        .select('*')
        .order('id', { ascending: false });

      if (imoveisData) {
        setMeusImoveis(imoveisData);
      } else {
        setMeusImoveis([]);
      }

    } catch (err) {
      console.error('Erro ao carregar dados do perfil:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleProfileChange(e) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const docFormData = new FormData();
      docFormData.append('file', file);
      docFormData.append('userId', user?.id || 'avatar');

      const res = await fetch('/api/upload-documento', {
        method: 'POST',
        body: docFormData,
      });

      const data = await res.json();
      if (data.documentoUrl) {
        setProfile((prev) => ({ ...prev, foto_url: data.documentoUrl }));
        setFeedback({ type: 'success', message: 'Foto de perfil atualizada!' });
      }
    } catch (err) {
      console.error('Erro no upload da foto de perfil:', err);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSalvarPerfil(e) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      if (!profile.nome_completo || !profile.telefone) {
        setFeedback({ type: 'error', message: 'Nome Completo e Telefone são obrigatórios.' });
        setSaving(false);
        return;
      }

      if (profile.tipo_anunciante === 'Sou Corretor(a)' && !profile.creci) {
        setFeedback({ type: 'error', message: 'Informe o número do seu CRECI.' });
        setSaving(false);
        return;
      }

      const payload = {
        id: user.id,
        nome_completo: profile.nome_completo,
        telefone: profile.telefone,
        redes_sociais: profile.redes_sociais,
        tipo_anunciante: profile.tipo_anunciante,
        creci: profile.tipo_anunciante === 'Sou Corretor(a)' ? profile.creci : '',
        bio: profile.bio,
        foto_url: profile.foto_url,
        status_verificacao: profile.status_verificacao,
      };

      const { error } = await supabase
        .from('profiles')
        .upsert([payload]);

      if (error) {
        throw new Error(error.message);
      }

      setFeedback({ type: 'success', message: 'Dados do perfil salvos com sucesso!' });
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      setFeedback({ type: 'error', message: err.message || 'Erro ao atualizar dados no banco de dados.' });
    } finally {
      setSaving(false);
    }
  }

  // Executa exclusão física completa do imóvel via API /api/deletar-imovel
  async function handleConfirmarExclusaoImovel() {
    if (!propertyToDelete) return;

    const idParaDeletar = propertyToDelete.id;
    setDeletingProperty(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/deletar-imovel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: idParaDeletar }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // 1. Atualiza estritamente o estado local removendo o imóvel excluído
        setMeusImoveis((prev) => prev.filter((item) => String(item.id) !== String(idParaDeletar)));
        
        // 2. Define feedback de sucesso no topo da tela
        setFeedback({ 
          type: 'success', 
          message: 'Imóvel e fotos excluídos permanentemente do sistema Imóveis Zona Sul Rio de Janeiro' 
        });
        
        // 3. Fecha o modal
        setPropertyToDelete(null);

        // 4. Rola a tela suavemente para o topo para mostrar a confirmação
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // 5. Revalida dados com a rota do Next.js
        router.refresh();
      } else {
        alert(data.error || 'Erro ao excluir imóvel no banco de dados.');
      }
    } catch (err) {
      console.error('Erro ao excluir imóvel:', err);
      alert('Falha na comunicação com o servidor ao deletar imóvel.');
    } finally {
      setDeletingProperty(false);
    }
  }

  // Ação de Exclusão Definitiva de Conta
  async function handleDeletarContaDefinitiva() {
    setDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await supabase.auth.signOut();
        alert('Sua conta, fotos e todos os seus imóveis foram excluídos com sucesso do sistema Imóveis Zona Sul Rio de Janeiro.');
        window.location.href = '/';
      } else {
        alert(data.error || 'Erro ao processar descadastro da conta.');
      }
    } catch (err) {
      console.error('Erro no descadastro:', err);
      alert('Falha na comunicação com o servidor ao excluir conta.');
    } finally {
      setDeletingAccount(false);
    }
  }

  // Reenvio de documento caso o status seja recusado
  async function handleReenviarDocumento(e) {
    e.preventDefault();
    if (!reuploadFile) {
      setReuploadError('Selecione uma foto da sua CNH ou RG (PNG, JPG ou WEBP).');
      return;
    }

    setReuploading(true);
    setReuploadError('');

    try {
      const docFormData = new FormData();
      docFormData.append('file', reuploadFile);
      docFormData.append('userId', user.id);

      const res = await fetch('/api/upload-documento', {
        method: 'POST',
        body: docFormData,
      });

      const data = await res.json();
      if (!res.ok || !data.documentoUrl) {
        throw new Error(data.error || 'Erro ao enviar a foto do documento.');
      }

      const novoDocumentoUrl = data.documentoUrl;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          documento_url: novoDocumentoUrl,
          status_verificacao: 'pendente',
          motivo_recusa: null,
        })
        .eq('id', user.id);

      if (dbError) {
        throw new Error(`Erro ao atualizar perfil: ${dbError.message}`);
      }

      fetch('/api/auth/verify-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: user.id,
          cpf: profile.cpf || user.user_metadata?.cpf,
          nome_completo: profile.nome_completo,
          data_nascimento: profile.data_nascimento || user.user_metadata?.data_nascimento,
          filiacao: profile.filiacao || user.user_metadata?.filiacao,
          documento_url: novoDocumentoUrl,
        }),
      }).catch((err) => console.error('Erro na revalidação por IA:', err));

      setProfile((prev) => ({
        ...prev,
        status_verificacao: 'pendente',
        documento_url: novoDocumentoUrl,
        motivo_recusa: null,
      }));
      setReuploadFile(null);
      setReuploadPreview(null);

    } catch (err) {
      console.error('Erro no reenvio do documento:', err);
      setReuploadError(err.message || 'Falha ao reenviar documento.');
    } finally {
      setReuploading(false);
    }
  }

  function formatMembroDesde(dateString) {
    if (!dateString) return 'Membro recente';
    const date = new Date(dateString);
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `Membro desde ${meses[date.getMonth()]} de ${date.getFullYear()}`;
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Carregando seu perfil de anunciante...</p>
      </div>
    );
  }

  // 1. TRAVA DE ACESSO: CADASTRO EM ANÁLISE (status = 'pendente')
  if (profile && profile.status_verificacao === 'pendente') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-md space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Cadastro em Análise</h1>
            <p className="text-amber-300 font-semibold text-xs sm:text-sm">
              Você receberá um e-mail assim que for aprovado.
            </p>
          </div>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
            Sua conta de anunciante está sob análise de segurança. Seus dados e a foto do documento já foram recebidos e estão em verificação pelo sistema.
          </p>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs text-slate-300 max-w-md mx-auto space-y-1 text-left">
            <p className="font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Detalhes da Verificação
            </p>
            <p><span className="text-slate-400">Status atual:</span> <strong className="text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 font-bold tracking-wide text-xs">PENDENTE</strong></p>
            <p><span className="text-slate-400">Anunciante:</span> <strong className="text-white">{profile.nome_completo}</strong></p>
            <p><span className="text-slate-400">E-mail:</span> <span className="text-sky-300">{user?.email}</span></p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => carregarPerfilEImoveis()}
              className="w-full sm:w-auto px-6 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Verificar Status Novamente</span>
            </button>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. TRAVA DE ACESSO: CADASTRO RECUSADO (status = 'recusado' ou 'rejeitado')
  if (profile && (profile.status_verificacao === 'recusado' || profile.status_verificacao === 'rejeitado')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <XCircle className="w-8 h-8" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-white">Cadastro Recusado</h1>
            <p className="text-rose-400 text-xs font-bold uppercase tracking-wider">
              Divergência ou Falha na Verificação do Documento
            </p>
          </div>

          {/* Motivo da Recusa */}
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-5 text-left space-y-2">
            <p className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              Motivo da Recusa:
            </p>
            <p className="text-xs sm:text-sm text-rose-100 leading-relaxed">
              {profile.motivo_recusa || 'Os dados contidos na imagem do documento enviada não conferem com as informações digitadas no formulário (Nome, CPF, Data de Nascimento ou Filiação).'}
            </p>
          </div>

          {/* Formulário de Reenvio do Documento */}
          <form onSubmit={handleReenviarDocumento} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-left space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-sky-400" />
              Reenviar Foto do Documento (RG ou CNH)
            </h3>
            <p className="text-xs text-slate-400">
              Tire uma nova foto legível e nítida da sua CNH ou RG (PNG, JPG ou WEBP) onde seja possível identificar Nome, CPF, Nascimento e Filiação.
            </p>

            {reuploadError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{reuploadError}</span>
              </div>
            )}

            <div className="relative border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-xl p-5 text-center bg-slate-900/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                    setReuploadError('Formato inválido! Envie uma foto/imagem da sua CNH ou RG (PNG, JPG ou WEBP). PDFs não são aceitos.');
                    setReuploadFile(null);
                    setReuploadPreview(null);
                    e.target.value = '';
                    return;
                  }
                  setReuploadError('');
                  setReuploadFile(file);
                  setReuploadPreview(URL.createObjectURL(file));
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
              />
              <div className="flex flex-col items-center justify-center gap-2">
                {reuploadFile ? (
                  <FileCheck className="w-6 h-6 text-emerald-400" />
                ) : (
                  <UploadCloud className="w-6 h-6 text-slate-400" />
                )}
                <span className="text-xs font-semibold text-slate-300">
                  {reuploadFile ? reuploadFile.name : 'Clique para escolher uma nova foto (PNG, JPG ou WEBP)'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Apenas fotos/imagens (PNG, JPG ou WEBP). Arquivos PDF não são aceitos.
                </span>
              </div>
            </div>

            {reuploadPreview && (
              <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                <img src={reuploadPreview} alt="Preview do novo documento" className="w-full h-full object-contain" />
              </div>
            )}

            <button
              type="submit"
              disabled={reuploading || !reuploadFile}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
            >
              {reuploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando e validando com IA...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Reenviar Documento para Análise</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/cadastro');
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              Sair e Fazer Novo Cadastro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button */}
      <div>
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Catálogo Principal
        </Link>
      </div>

      {/* BANNER DE FEEDBACK GLOBAL NO TOPO DA PÁGINA */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-medium transition-all shadow-xl ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center gap-3">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedback(null)} 
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AVISO DE TRANSPARÊNCIA E SEGURANÇA (Destaque no topo) */}
      <div className="bg-gradient-to-r from-sky-950/80 via-indigo-950/80 to-slate-900 border border-sky-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Transparência e Segurança no Perfil
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Público para Clientes
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-4xl">
              Suas informações de perfil (<strong>Nome, Telefone, Redes Sociais, Creci, Bio e Avaliações</strong>) são públicas. Isso garante transparência e segurança para que os clientes confirmem sua identidade antes de fechar um negócio.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Principal: Formulário + Sidebar de Estatísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Coluna Esquerda: Formulário de Perfil */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-sky-500/20">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Editar Dados Públicos do Perfil</h1>
                  <p className="text-slate-400 text-xs">Mantenha seus dados de contato e credenciais atualizados</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {profile.status_verificacao === 'aprovado' ? (
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Perfil Verificado
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Aguardando Aprovação
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSalvarPerfil} className="space-y-6">
              
              {/* Foto de Perfil (Avatar Upload) */}
              <div className="flex items-center gap-6 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-sky-500/40 flex items-center justify-center text-slate-400">
                    {profile.foto_url ? (
                      <img src={profile.foto_url} alt={profile.nome_completo} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-slate-500" />
                    )}
                  </div>
                  <label className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center rounded-2xl transition-opacity cursor-pointer text-[10px] font-bold text-sky-400">
                    <Camera className="w-5 h-5 mb-0.5" />
                    Alterar
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">Foto de Perfil</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Sua foto transmite confiança e humaniza seu atendimento.</p>
                  <label className="inline-flex items-center gap-1.5 text-xs text-sky-400 font-semibold mt-2 hover:underline cursor-pointer">
                    {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    <span>{uploadingAvatar ? 'Enviando foto...' : 'Escolher Imagem de Perfil'}</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Nome Completo e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Nome Completo *
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-4 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      name="nome_completo"
                      value={profile.nome_completo}
                      onChange={handleProfileChange}
                      placeholder="Seu nome exibido no anúncio"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Telefone / WhatsApp de Contato *
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-4 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      name="telefone"
                      value={profile.telefone}
                      onChange={handleProfileChange}
                      placeholder="(21) 99999-9999"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Redes Sociais e Tipo de Anunciante */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Redes Sociais (Instagram, TikTok, etc.)
                  </label>
                  <div className="relative flex items-center">
                    <Globe className="absolute left-4 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      name="redes_sociais"
                      value={profile.redes_sociais}
                      onChange={handleProfileChange}
                      placeholder="instagram.com/seu.perfil"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Tipo de Anunciante *
                  </label>
                  <select
                    name="tipo_anunciante"
                    value={profile.tipo_anunciante}
                    onChange={handleProfileChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Sou Proprietário(a)">Sou Proprietário(a)</option>
                    <option value="Sou Corretor(a)">Sou Corretor(a)</option>
                    <option value="Sou Administrador(a)">Sou Administrador(a)</option>
                  </select>
                </div>
              </div>

              {/* Campo CRECI (Apenas se "Sou Corretor(a)") */}
              {profile.tipo_anunciante === 'Sou Corretor(a)' && (
                <div>
                  <label className="block text-xs font-semibold text-amber-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    Número do CRECI (Obrigatório para Corretores) *
                  </label>
                  <input
                    type="text"
                    name="creci"
                    value={profile.creci}
                    onChange={handleProfileChange}
                    placeholder="Ex: CRECI 12345-F/RJ"
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    required={profile.tipo_anunciante === 'Sou Corretor(a)'}
                  />
                </div>
              )}

              {/* Campo "Quem Sou" (Bio com limite de 300 caracteres e contador) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Quem Sou (Bio Pública)
                  </label>
                  <span className={`text-xs font-bold ${
                    (profile.bio || '').length > 280 ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {(profile.bio || '').length}/300 caracteres
                  </span>
                </div>
                <textarea
                  name="bio"
                  rows={3}
                  maxLength={300}
                  value={profile.bio}
                  onChange={handleProfileChange}
                  placeholder="Apresente sua experiência imobiliária, bairros em que atua e diferenciais de atendimento na Zona Sul..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>

              {/* Botão Salvar */}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Salvando Alterações...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Salvar Alterações do Perfil</span>
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* COLUNA DIREITA: ESTATÍSTICAS E SELOS DE CONFIANÇA */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card de Estatísticas */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Estatísticas & Confiança
            </h3>

            {/* Selo de Perfil Verificado */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Selo de Segurança:</span>
                {profile.status_verificacao === 'aprovado' ? (
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold rounded-lg flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Perfil Verificado
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold rounded-lg flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Em Análise
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {profile.status_verificacao === 'aprovado'
                  ? 'Sua documentação foi aprovada pela equipe de segurança do Imóveis Zona Sul.'
                  : 'Sua foto de RG/CNH está em análise para concessão do selo de perfil verificado.'}
              </p>
            </div>

            {/* Imóveis Ativos Registrados */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Imóveis Ativos Registrados</span>
                <span className="text-2xl font-black text-white mt-0.5 block">{meusImoveis.length}</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Home className="w-6 h-6" />
              </div>
            </div>

            {/* Membro Desde */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
              <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{formatMembroDesde(profile.created_at)}</span>
            </div>

            {/* Botão Anunciar Imóvel */}
            <Link
              href="/admin"
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 text-xs transition-all hover:scale-[1.01]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar Novo Imóvel</span>
            </Link>
          </div>

          {/* SEÇÃO DE DEPOIMENTOS / AVALIAÇÕES DE CLIENTES */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                Avaliações de Clientes
              </h3>
              <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>5.0 (2)</span>
              </div>
            </div>

            <div className="space-y-3">
              {avaliacoes.map((av) => (
                <div key={av.id} className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{av.cliente}</span>
                    <span className="text-[10px] text-slate-500">{av.data}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(av.nota)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{av.comentario}"
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <span className="text-[11px] text-slate-400">
                🔒 Avaliações verificadas enviadas por compradores e locatários.
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* GERENCIAMENTO DE ANÚNCIOS DO ANUNCIANTE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Meus Imóveis Cadastrados
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
                {meusImoveis.length} {meusImoveis.length === 1 ? 'anúncio' : 'anúncios'}
              </span>
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">Gerencie ou exclua seus imóveis publicados no catálogo da Zona Sul</p>
          </div>

          <Link
            href="/admin"
            className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar Imóvel</span>
          </Link>
        </div>

        {meusImoveis.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/50 border border-slate-800/80 rounded-2xl space-y-3">
            <p className="text-slate-400 text-sm">Você ainda não possui nenhum imóvel ativo cadastrado.</p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-xs text-sky-400 hover:underline font-bold"
            >
              Clique aqui para publicar seu primeiro imóvel na Zona Sul
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {meusImoveis.map((imovel) => {
              const fotos = imovel.fotos || [];
              const capa = fotos.length > 0 ? fotos[0] : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';
              const precoFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(imovel.preco || 0);

              return (
                <div key={imovel.id} className="glass-card rounded-2xl overflow-hidden flex flex-col group border border-slate-800">
                  <div className="relative h-48 w-full bg-slate-950">
                    <img src={capa} alt={imovel.titulo} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold">
                        {imovel.transacao || 'Vender'}
                      </span>
                      <span className="bg-slate-900/90 text-slate-200 text-[11px] px-2.5 py-1 rounded-lg font-medium border border-slate-700">
                        {imovel.tipo || 'Apartamento'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <span className="text-sky-400 text-xs font-semibold mb-1">{imovel.bairro || 'Zona Sul'}</span>
                    <h3 className="text-sm font-bold text-white line-clamp-1 mb-2">{imovel.titulo}</h3>
                    <p className="text-lg font-black text-emerald-400 mb-4">{precoFormatted}</p>

                    <div className="mt-auto border-t border-slate-800 pt-3 flex items-center justify-between">
                      {/* Redireciona com id via Query Parameter para preencher o formulário no admin */}
                      <Link
                        href={`/admin?id=${imovel.id}`}
                        className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar
                      </Link>

                      {/* Modal de Alerta de Exclusão do Imóvel */}
                      <button
                        type="button"
                        onClick={() => setPropertyToDelete(imovel)}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* SEÇÃO PERIGO: ENCERRAMENTO DEFINITIVO DA CONTA */}
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 text-rose-400 font-bold">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h3 className="text-base">Zona de Perigo - Descadastro Definitivo</h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Ao deletar sua conta permanentemente, todos os seus <strong>imóveis publicados</strong>, <strong>fotos salvas</strong>, <strong>dados do perfil</strong> e <strong>documentos de verificação</strong> serão totalmente apagados sem possibilidade de recuperação.
        </p>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-5 py-3 bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 cursor-pointer"
        >
          <UserX className="w-4 h-4" />
          <span>Deletar minha conta permanentemente</span>
        </button>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO LIMPA DO IMÓVEL */}
      {propertyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-7 h-7 animate-bounce" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-white">Excluir Imóvel Permanentemente?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tem certeza? Todas as informações do anúncio <strong className="text-white font-bold">"{propertyToDelete.titulo}"</strong> e todas as informações do imóvel e fotos serão excluídas permanentemente do nosso sistema.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPropertyToDelete(null)}
                disabled={deletingProperty}
                className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmarExclusaoImovel}
                disabled={deletingProperty}
                className="w-1/2 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {deletingProperty ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo Imóvel...</span>
                  </>
                ) : (
                  <span>Confirmar Exclusão</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE DELEÇÃO DA CONTA */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-7 h-7 animate-pulse" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-white">Deletar Conta Permanentemente?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Esta ação é <strong className="text-rose-400 font-bold">IRREVERSÍVEL</strong>. Todos os seus imóveis, fotos e dados de perfil serão completamente apagados do banco de dados.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
                Digite <span className="text-rose-400 font-bold font-mono">DELETAR</span> para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETAR"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-center text-rose-400 font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={deletingAccount}
                className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDeletarContaDefinitiva}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETAR' || deletingAccount}
                className="w-1/2 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Confirmar Exclusão</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
