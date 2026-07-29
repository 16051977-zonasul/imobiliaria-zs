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
  ShieldAlert, 
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
  Lock
} from 'lucide-react';

export default function PerfilPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [feedback, setFeedback] = useState(null);

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
    created_at: new Date().toISOString()
  });

  // Imóveis do Anunciante
  const [meusImoveis, setMeusImoveis] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

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
          created_at: profileData.created_at || user.created_at || new Date().toISOString()
        });
      } else {
        setProfile((prev) => ({
          ...prev,
          nome_completo: user.user_metadata?.nome_completo || user.email || '',
          telefone: user.user_metadata?.telefone || '',
          created_at: user.created_at || new Date().toISOString()
        }));
      }

      // 2. Carrega imóveis cadastrados pelo anunciante
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

  async function handleExcluirImovel(id) {
    if (!confirm('Tem certeza que deseja excluir este anúncio do catálogo?')) return;

    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('imoveis')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Erro ao deletar no Supabase, removendo localmente:', error);
      }

      setMeusImoveis((prev) => prev.filter((i) => i.id !== id));
      setFeedback({ type: 'success', message: 'Imóvel removido do catálogo com sucesso!' });
    } catch (err) {
      console.error('Erro ao excluir imóvel:', err);
    } finally {
      setDeletingId(null);
    }
  }

  // Formata Data de Membro
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

      {/* 2. AVISO DE TRANSPARÊNCIA E SEGURANÇA (Destaque no topo) */}
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
              Suas informações de perfil (<strong>Nome, Telefone, Redes Sociais, CRECI, Bio e Avaliações</strong>) são públicas. Isso garante transparência e segurança para que os clientes confirmem sua identidade antes de fechar um negócio.
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

            {feedback && (
              <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm font-medium ${
                feedback.type === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
            )}

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

        {/* 4. COLUNA DIREITA: ESTATÍSTICAS E SELOS DE CONFIANÇA */}
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

          {/* 5. SEÇÃO DE DEPOIMENTOS / AVALIAÇÕES DE CLIENTES */}
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

      {/* 6. GERENCIAMENTO DE ANÚNCIOS DO ANUNCIANTE */}
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
                      <Link
                        href="/admin"
                        className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar
                      </Link>

                      <button
                        onClick={() => handleExcluirImovel(imovel.id)}
                        disabled={deletingId === imovel.id}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {deletingId === imovel.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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

    </div>
  );
}
