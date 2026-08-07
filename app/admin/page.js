'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { convertToWebP, uploadFileToR2, formatR2Url, formatR2Urls } from '@/lib/imageUtils';
import { 
  Building2, 
  UploadCloud, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  DollarSign,
  MapPin,
  Maximize2,
  Bed,
  Bath,
  Car,
  Eye,
  Loader2,
  ShieldAlert,
  Clock,
  RefreshCw,
  LogOut,
  XCircle,
  Image as ImageIcon,
  Home,
  User,
  Edit3,
  Star
} from 'lucide-react';
import Link from 'next/link';

const BAIRROS_ZONA_SUL = [
  'Copacabana',
  'Ipanema',
  'Leblon',
  'Botafogo',
  'Flamengo',
  'Leme',
  'Gávea',
  'Humaitá',
  'Urca',
  'Jardim Botânico',
  'São Conrado',
  'Catete',
  'Laranjeiras'
];

function AdminFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Auth & Profile state
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Lista de Fotos selecionadas: [{ id, file, previewUrl, remoteUrl }]
  const [selectedFotos, setSelectedFotos] = useState([]);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'Apartamento',
    transacao: 'Vender',
    preco: '',
    preco_mensal_temporada: '',
    condominio: '',
    iptu: '',
    bairro: 'Ipanema',
    quartos: '2',
    banheiros: '2',
    vagas: '1',
    area_m2: '80'
  });

  useEffect(() => {
    checkAuthAndProfile();
  }, []);

  useEffect(() => {
    if (editId) {
      carregarImovelParaEdicao(editId);
    }
  }, [editId]);

  async function checkAuthAndProfile() {
    setAuthLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login?redirectTo=/admin');
        return;
      }
      setUser(user);

      // Busca perfil no Supabase
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
      } else {
        setProfile({
          nome_completo: user.user_metadata?.nome_completo || user.email,
          cpf: user.user_metadata?.cpf || 'Cadastrado',
          status_verificacao: user.user_metadata?.status_verificacao || 'pendente'
        });
      }
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
    } finally {
      setAuthLoading(false);
    }
  }

  // Se houver um ID via Query Parameter (/admin?id=123), carrega os dados para edição
  async function carregarImovelParaEdicao(id) {
    try {
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.warn('Erro ao buscar imóvel para edição:', error);
        return;
      }

      if (data) {
        setEditingId(data.id);
        setFormData({
          titulo: data.titulo || '',
          descricao: data.descricao || '',
          tipo: data.tipo || 'Apartamento',
          transacao: data.transacao || 'Vender',
          preco: formatCurrency(String(data.preco || '')),
          preco_mensal_temporada: formatCurrency(String(data.preco_mensal_temporada || '')),
          condominio: formatCurrency(String(data.condominio || '')),
          iptu: formatCurrency(String(data.iptu || '')),
          bairro: data.bairro || 'Ipanema',
          quartos: String(data.quartos || '2'),
          banheiros: String(data.banheiros || '2'),
          vagas: String(data.vagas || '1'),
          area_m2: String(data.area_m2 || '80'),
        });

        if (data.fotos && Array.isArray(data.fotos)) {
          const existingPhotos = data.fotos.map((url, idx) => ({
            id: `remote_${idx}_${Date.now()}`,
            file: null,
            previewUrl: null,
            remoteUrl: formatR2Url(url),
          }));
          setSelectedFotos(existingPhotos);
          setCoverPhotoIndex(0);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar imóvel:', err);
    }
  }

  // Formata valor monetário: 2500000 -> "2.500.000"
  function formatCurrency(value) {
    const nums = String(value).replace(/\D/g, '');
    if (!nums) return '';
    return new Intl.NumberFormat('pt-BR').format(Number(nums));
  }

  // Converte string formatada de volta para número puro
  function parseCurrency(formatted) {
    return formatted ? String(formatted).replace(/\./g, '').replace(/,/g, '') : '';
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (['preco', 'condominio', 'iptu', 'preco_mensal_temporada'].includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: formatCurrency(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  // Seleção e preview instantâneo de mídias no frontend
  function handleSelectFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems = files.map((file) => ({
      id: `${Date.now()}_${Math.random()}`,
      file: file,
      previewUrl: URL.createObjectURL(file),
      remoteUrl: null,
    }));

    setSelectedFotos((prev) => [...prev, ...newItems]);
  }

  function removerFoto(index) {
    setSelectedFotos((prev) => {
      const target = prev[index];
      if (target?.previewUrl && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });

    if (coverPhotoIndex === index) {
      setCoverPhotoIndex(0);
    } else if (coverPhotoIndex > index) {
      setCoverPhotoIndex((prev) => prev - 1);
    }
  }

  // Envio do formulário: Upload R2 + Salvamento no Supabase com array de URLs públicas em 'fotos'
  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback(null);

    if (!formData.titulo || !formData.preco) {
      setFeedback({ type: 'error', message: 'Preencha ao menos o Título e o Preço do imóvel.' });
      return;
    }

    setSubmitting(true);

    try {
      setFeedback({ type: 'loading', message: 'Otimizando imagens e enviando mídias ao sistema...' });

      // 1. Processa cada foto selecionada (Upload R2 ou reutilização de URL remota)
      const imageUrls = [];

      for (let i = 0; i < selectedFotos.length; i++) {
        const item = selectedFotos[i];

        // Se a foto já for uma URL remota válida do R2 (em modo de edição)
        if (item.remoteUrl && (item.remoteUrl.startsWith('http://') || item.remoteUrl.startsWith('https://')) && !item.remoteUrl.startsWith('blob:')) {
          imageUrls.push(formatR2Url(item.remoteUrl));
          continue;
        }

        // Se for um arquivo novo enviado pelo usuário
        if (item.file) {
          const uploadIndex = selectedFotos.filter((f) => f.file).indexOf(item) + 1;
          const totalNewFiles = selectedFotos.filter((f) => f.file).length;

          setFeedback({
            type: 'loading',
            message: `Otimizando e enviando imagem ${uploadIndex} de ${totalNewFiles} em WebP para o sistema...`,
          });

          // a. Converte para WebP via Canvas
          const webpFile = await convertToWebP(item.file, 0.85);

          // b. Upload para o Cloudflare R2
          const r2PublicUrl = await uploadFileToR2(webpFile);

          if (r2PublicUrl && (r2PublicUrl.startsWith('http://') || r2PublicUrl.startsWith('https://')) && !r2PublicUrl.startsWith('blob:')) {
            const formatted = formatR2Url(r2PublicUrl);
            imageUrls.push(formatted);
          } else {
            console.warn(`[R2 Warning] Não foi possível obter URL pública para ${item.file.name}`);
          }
        }
      }

      // Reordena para posicionar a foto de Capa no índice 0
      if (coverPhotoIndex > 0 && coverPhotoIndex < imageUrls.length) {
        const coverUrl = imageUrls.splice(coverPhotoIndex, 1)[0];
        imageUrls.unshift(coverUrl);
      }

      // 2. LOG EXPLICITO: logo após a resposta do R2 e antes do salvamento no Supabase
      console.log('imageUrls:', imageUrls);

      setFeedback({ type: 'loading', message: 'Gravando dados do imóvel no catálogo...' });

      // 3. Monta o payload final com o array de strings 'imageUrls' na propriedade 'fotos'
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        usuario_id: user?.id,
        titulo: formData.titulo,
        descricao: formData.descricao || '',
        tipo: formData.tipo,
        transacao: formData.transacao,
        preco: parseCurrency(formData.preco),
        preco_mensal_temporada: parseCurrency(formData.preco_mensal_temporada),
        condominio: formData.transacao === 'Temporada' ? 0 : parseCurrency(formData.condominio),
        iptu: formData.transacao === 'Temporada' ? 0 : parseCurrency(formData.iptu),
        bairro: formData.bairro,
        quartos: formData.quartos,
        banheiros: formData.banheiros,
        vagas: formData.vagas,
        area_m2: formData.area_m2,
        fotos: imageUrls,
      };

      const res = await fetch('/api/salvar-imovel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback(null);
        setShowSuccessModal(true);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Erro ao cadastrar imóvel.' });
      }
    } catch (err) {
      console.error('Erro no envio do formulário:', err);
      setFeedback({ type: 'error', message: err.message || 'Erro na conexão com o servidor.' });
    } finally {
      setSubmitting(false);
    }
  }

  // 1. Tela de Carregamento Inicial
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Verificando credenciais do anunciante...</p>
      </div>
    );
  }

  // 2. TELA DE CONTA EM ANÁLISE DE SEGURANÇA (Se status === 'pendente')
  if (profile && profile.status_verificacao === 'pendente') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Conta em Análise de Segurança</h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xl mx-auto mt-2">
              Sua conta está em análise de segurança pela equipe do <strong className="text-sky-400">Imóveis Zona Sul Rio de Janeiro</strong>.
            </p>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 text-left max-w-md mx-auto space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
              <span className="text-slate-400 font-medium">Anunciante:</span>
              <span className="font-bold text-white">{profile.nome_completo}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
              <span className="text-slate-400 font-medium">Status da Verificação:</span>
              <span className="font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Em Análise
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
              <span className="text-slate-400 font-medium">Documento (RG/CNH):</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Recebido
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">E-mail:</span>
              <span className="font-semibold text-slate-200">{user?.email}</span>
            </div>
          </div>

          <div className="p-4 bg-sky-950/40 border border-sky-500/20 rounded-2xl text-xs text-sky-300 max-w-xl mx-auto leading-relaxed text-left">
            🔒 O envio de documentos garante a autenticidade de cada anunciante e previne fraudes na plataforma. Assim que nossa equipe validar os dados, a publicação de imóveis será liberada automaticamente.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={checkAuthAndProfile}
              className="w-full sm:w-auto px-6 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Atualizar Status</span>
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

  // 3. TELA DE REJEIÇÃO DA CONTA
  if (profile && profile.status_verificacao === 'rejeitado') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <XCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white">Verificação Não Aprovada</h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Sua solicitação de cadastro de anunciante não pôde ser aprovada. Verifique a legibilidade dos documentos enviados ou entre em contato com nosso suporte.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Sair e Fazer Novo Cadastro
          </button>
        </div>
      </div>
    );
  }

  // Capa para o Card de Pré-visualização (Reflete a foto de capa selecionada pelo usuário)
  const selectedCoverItem = selectedFotos[coverPhotoIndex] || selectedFotos[0];
  const previewCapa = selectedFotos.length > 0 
    ? (selectedCoverItem?.previewUrl || selectedCoverItem?.remoteUrl)
    : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';

  // 4. PAINEL DE ANÚNCIO LIBERADO (Para anunciantes 'aprovados')
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Back button */}
      <div className="mb-6 flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Catálogo
        </Link>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">Logado como: <strong className="text-white">{profile?.nome_completo || user?.email}</strong></span>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="text-rose-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-sky-500/20">
                {editingId ? <Edit3 className="w-5 h-5 text-white" /> : <Building2 className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {editingId ? `Editar Imóvel (ID #${editingId})` : 'Cadastrar Novo Imóvel'}
                </h1>
                <p className="text-slate-400 text-xs">
                  {editingId ? 'Atualize os dados e fotos do imóvel cadastrado' : 'Preencha os dados do imóvel na Zona Sul do Rio de Janeiro'}
                </p>
              </div>
            </div>

            {feedback && (
              <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm font-medium ${
                feedback.type === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                  : feedback.type === 'loading'
                    ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {feedback.type === 'success' 
                  ? <CheckCircle2 className="w-5 h-5 shrink-0" /> 
                  : feedback.type === 'loading' 
                    ? <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                    : <AlertCircle className="w-5 h-5 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Título do Anúncio *
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ex: Cobertura Duplex reformada com vista para o mar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              {/* Tipo e Transação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Tipo do Imóvel
                  </label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Apartamento">Apartamento</option>
                    <option value="Cobertura">Cobertura</option>
                    <option value="Casa">Casa</option>
                    <option value="Studio">Studio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Transação
                  </label>
                  <select
                    name="transacao"
                    value={formData.transacao}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Vender">Vender</option>
                    <option value="Alugar">Alugar</option>
                    <option value="Temporada">Temporada</option>
                  </select>
                </div>
              </div>

              {/* Preço, Condomínio, IPTU adaptáveis conforme Transação */}
              {formData.transacao === 'Temporada' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Preço da Diária (R$) *
                    </label>
                    <input
                      type="text"
                      name="preco"
                      value={formData.preco}
                      onChange={handleChange}
                      placeholder="450"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      inputMode="numeric"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                      <span>Preço Mensal (Temporada) (R$)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                    </label>
                    <input
                      type="text"
                      name="preco_mensal_temporada"
                      value={formData.preco_mensal_temporada}
                      onChange={handleChange}
                      placeholder="9.500"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      {formData.transacao === 'Alugar' ? 'Valor do Aluguel (por mês) (R$) *' : 'Preço (R$) *'}
                    </label>
                    <input
                      type="text"
                      name="preco"
                      value={formData.preco}
                      onChange={handleChange}
                      placeholder={formData.transacao === 'Alugar' ? '4.500' : '2.500.000'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      inputMode="numeric"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Condomínio (R$)
                    </label>
                    <input
                      type="text"
                      name="condominio"
                      value={formData.condominio}
                      onChange={handleChange}
                      placeholder="1.800"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      inputMode="numeric"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      IPTU (R$)
                    </label>
                    <input
                      type="text"
                      name="iptu"
                      value={formData.iptu}
                      onChange={handleChange}
                      placeholder="450"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              )}

              {/* Bairro e Metragem */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Bairro (Zona Sul)
                  </label>
                  <select
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {BAIRROS_ZONA_SUL.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Área Total (m²)
                  </label>
                  <input
                    type="number"
                    name="area_m2"
                    value={formData.area_m2}
                    onChange={handleChange}
                    placeholder="120"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Quartos, Banheiros, Vagas */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Quartos
                  </label>
                  <input
                    type="number"
                    name="quartos"
                    value={formData.quartos}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Banheiros
                  </label>
                  <input
                    type="number"
                    name="banheiros"
                    value={formData.banheiros}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Vagas
                  </label>
                  <input
                    type="number"
                    name="vagas"
                    value={formData.vagas}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Descrição Detalhada
                </label>
                <textarea
                  name="descricao"
                  rows={4}
                  value={formData.descricao}
                  onChange={handleChange}
                  placeholder="Detalhes sobre a vista, acabamentos, posição do sol, condomínio e localização..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Upload de Fotos com Seleção da Foto Capa/Destaque */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Fotos do Imóvel</span>
                  <span className="text-[10px] text-sky-400 font-normal">Otimizadas para WebP</span>
                </label>

                <div className="relative border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 text-center bg-slate-950/50 transition-colors group cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleSelectFiles}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={submitting}
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-sky-400 transition-colors" />
                    <span className="text-xs font-semibold text-slate-300">
                      Clique ou arraste imagens aqui para selecionar
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Conversão automática para web e upload no sistema
                    </span>
                  </div>
                </div>

                {/* Previews das fotos selecionadas com seletor de Foto Capa */}
                {selectedFotos.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Fotos Selecionadas:</span>
                      <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400" /> Clique na estrela para escolher a Foto de Capa
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedFotos.map((item, idx) => {
                        const isCover = coverPhotoIndex === idx;
                        return (
                          <div 
                            key={item.id || idx} 
                            className={`relative rounded-xl overflow-hidden h-28 border-2 transition-all group ${
                              isCover ? 'border-amber-400 shadow-lg shadow-amber-400/20 ring-2 ring-amber-400/30' : 'border-slate-800 hover:border-slate-600'
                            }`}
                          >
                            <img src={item.previewUrl || item.remoteUrl} alt="Preview" className="w-full h-full object-cover" />
                            
                            {/* Botão de Definir Foto Capa */}
                            <button
                              type="button"
                              onClick={() => setCoverPhotoIndex(idx)}
                              className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-md ${
                                isCover ? 'bg-amber-400 text-slate-950' : 'bg-slate-950/80 text-slate-300 hover:bg-amber-400 hover:text-slate-950'
                              }`}
                            >
                              <Star className={`w-3 h-3 ${isCover ? 'fill-slate-950 text-slate-950' : 'text-slate-300'}`} />
                              <span>{isCover ? 'Foto Capa' : 'Definir Capa'}</span>
                            </button>

                            {/* Botão de Excluir Foto */}
                            <button
                              type="button"
                              onClick={() => removerFoto(idx)}
                              className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Otimizando e enviando imagens ao sistema.....</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-5 h-5" />
                    <span>{editingId ? 'Salvar Alterações do Imóvel' : 'Publicar Imóvel'}</span>
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                <span>Pré-visualização do Card</span>
              </div>
              <span className="text-amber-400 text-[11px] font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" /> Capa selecionada
              </span>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden flex flex-col border border-sky-500/30">
              <div className="relative h-60 w-full bg-slate-950">
                <img
                  src={previewCapa}
                  alt="Preview Capa"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold">
                    {formData.transacao}
                  </span>
                  <span className="bg-slate-900/90 text-slate-200 text-[11px] px-2.5 py-1 rounded-lg font-medium border border-slate-700">
                    {formData.tipo}
                  </span>
                </div>
              </div>

              <div className="p-5 flex flex-col">
                <div className="flex items-center gap-1.5 text-sky-400 text-xs font-semibold mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{formData.bairro}</span>
                </div>

                <h3 className="text-base font-bold text-white mb-2 line-clamp-2">
                  {formData.titulo || 'Título do seu anúncio aqui'}
                </h3>

                <p className="text-2xl font-black text-emerald-400 mb-4">
                  {formData.preco ? (
                    formData.transacao === 'Temporada' 
                      ? `R$ ${formData.preco} / diária` 
                      : formData.transacao === 'Alugar' 
                        ? `R$ ${formData.preco} / mês` 
                        : `R$ ${formData.preco}`
                  ) : 'R$ 0'}
                </p>

                <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-300 font-medium">
                  <div className="flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formData.area_m2 || 0} m²</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formData.quartos || 0} qts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formData.banheiros || 0} banh</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formData.vagas || 0} vag</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL DE CONFIRMAÇÃO DE PUBLICAÇÃO / EDIÇÃO BEM-SUCEDIDA */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-sky-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tight">
                {editingId ? 'Imóvel Atualizado com Sucesso!' : 'Imóvel Publicado com Sucesso!'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Seu imóvel já está online e disponível no catálogo da <strong>Imóveis Zona Sul Rio de Janeiro</strong>.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Ver no Catálogo Principal</span>
              </button>

              <button
                type="button"
                onClick={() => router.push('/perfil')}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Ir para Meus Anúncios (Perfil)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setEditingId(null);
                  setFormData({
                    titulo: '',
                    descricao: '',
                    tipo: 'Apartamento',
                    transacao: 'Vender',
                    preco: '',
                    preco_mensal_temporada: '',
                    condominio: '',
                    iptu: '',
                    bairro: 'Ipanema',
                    quartos: '2',
                    banheiros: '2',
                    vagas: '1',
                    area_m2: '80'
                  });
                  setSelectedFotos([]);
                  setCoverPhotoIndex(0);
                  router.push('/admin');
                }}
                className="w-full py-2.5 text-xs font-semibold text-sky-400 hover:underline cursor-pointer"
              >
                Cadastrar Outro Imóvel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Carregando painel do imóvel...</p>
      </div>
    }>
      <AdminFormContent />
    </Suspense>
  );
}
