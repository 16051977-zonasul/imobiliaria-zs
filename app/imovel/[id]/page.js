'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatR2Url, formatR2Urls } from '@/lib/imageUtils';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Maximize2, 
  Camera, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Home,
  User,
  Share2,
  Building,
  Tag,
  DollarSign,
  Calendar,
  MessageCircle,
  ArrowRight,
  Check
} from 'lucide-react';

const MOCK_IMOVEIS = [
  {
    id: 101,
    titulo: 'Apartamento de Alto Padrão Quadrilátero de Ipanema',
    descricao: 'Amplo apartamento com vista lateral para o mar, reformado por arquiteto renomado. Sala em 3 ambientes com projeto de iluminação em LED, piso em porcelanato 120x120, lavabo decorado. São 3 suítes repletas de armários planejados de altíssima qualidade, cozinha gourmet totalmente equipada e dependência completa de empregada. Edifício gabaritado com portaria 24 horas e 2 vagas de garagem escrituradas.',
    tipo: 'Apartamento',
    transacao: 'Vender',
    preco: 2850000,
    condominio: 2200,
    iptu: 650,
    bairro: 'Ipanema',
    quartos: 3,
    banheiros: 3,
    vagas: 2,
    area_m2: 145,
    fotos: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 102,
    titulo: 'Cobertura Duplex com Piscina e Vista Cristo Redentor',
    descricao: 'Exclusiva cobertura no Leblon com terraço privativo, churrasqueira, piscina aquecida e vista panorâmica espetacular para o Cristo Redentor. 1º Piso: Salão integrado com varandão, 3 suítes, copa-cozinha planejada. 2º Piso: Suíte máster com walk-in closet, home theater e área externa completa para entretenimento. 3 vagas soltas na garagem.',
    tipo: 'Cobertura',
    transacao: 'Vender',
    preco: 6200000,
    condominio: 4500,
    iptu: 1200,
    bairro: 'Leblon',
    quartos: 4,
    banheiros: 5,
    vagas: 3,
    area_m2: 280,
    fotos: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 103,
    titulo: 'Studio Moderno Reformado em Copacabana',
    descricao: 'Ótima oportunidade para investimento ou moradia a 2 quadras da praia de Copacabana (Posto 4). Studio totalmente reformado, piso vinílico, ar-condicionado split silencioso, cozinha americana com cooktop e armários sob medida. Prédio estritamente residencial com circuito interno de TV e portaria 24 horas.',
    tipo: 'Studio',
    transacao: 'Alugar',
    preco: 4200,
    condominio: 650,
    iptu: 120,
    bairro: 'Copacabana',
    quartos: 1,
    banheiros: 1,
    vagas: 0,
    area_m2: 38,
    fotos: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 104,
    titulo: 'Casa de Vila Charmosa no Jardim Botânico',
    descricao: 'Vila silenciosa, arborizada e extremamente segura no coração do Jardim Botânico. Casa de 2 pavimentos com jardim frontal, pé-direito alto, 2 amplos dormitórios e varanda acolhedora. Próxima aos melhores restaurantes e ao Parque Lage.',
    tipo: 'Casa',
    transacao: 'Alugar',
    preco: 9800,
    condominio: 350,
    iptu: 380,
    bairro: 'Jardim Botânico',
    quartos: 2,
    banheiros: 2,
    vagas: 1,
    area_m2: 92,
    fotos: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 105,
    titulo: 'Apartamento de Temporada Vista Mar Copacabana',
    descricao: 'Lindo apartamento totalmente equipado para estadias curtas a 50 metros do Posto 4 em Copacabana. Wi-Fi de alta velocidade, Smart TV, roupa de cama e banho premium inclusas. Ideal para férias ou trabalho remoto na Zona Sul do Rio.',
    tipo: 'Apartamento',
    transacao: 'Temporada',
    preco: 650,
    condominio: 0,
    iptu: 0,
    bairro: 'Copacabana',
    quartos: 2,
    banheiros: 1,
    vagas: 1,
    area_m2: 65,
    fotos: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
    ]
  }
];

export default function ImovelDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const id = params.id;

  const [imovel, setImovel] = useState(null);
  const [imoveisSimilares, setImoveisSimilares] = useState([]);
  const [anunciante, setAnunciante] = useState(null);
  const [loading, setLoading] = useState(true);

  // Galeria de fotos
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (id) {
      carregarDetalhesImovel(id);
    }
  }, [id]);

  async function carregarDetalhesImovel(imovelId) {
    setLoading(true);
    try {
      // 1. Busca dados do imóvel no Supabase
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id', imovelId)
        .maybeSingle();

      let targetImovel = data;

      // Se não encontrou no Supabase, tenta buscar no Mock
      if (!targetImovel) {
        targetImovel = MOCK_IMOVEIS.find((item) => String(item.id) === String(imovelId));
      }

      if (targetImovel) {
        setImovel(targetImovel);
        carregarAnunciante(targetImovel);
        carregarImoveisSimilares(targetImovel);
      } else {
        setImovel(null);
      }

    } catch (err) {
      console.error('Erro ao buscar detalhes do imóvel:', err);
      const fallback = MOCK_IMOVEIS.find((item) => String(item.id) === String(imovelId));
      setImovel(fallback || null);
    } finally {
      setLoading(false);
    }
  }

  // Busca dados do anunciante responsável
  async function carregarAnunciante(currentImovel) {
    try {
      let profileData = null;

      if (currentImovel.usuario_id) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentImovel.usuario_id)
          .maybeSingle();
        profileData = data;
      }

      if (!profileData) {
        // Busca primeiro perfil verificado ativo como demonstração
        const { data: list } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
        if (list && list.length > 0) {
          profileData = list[0];
        }
      }

      if (profileData) {
        setAnunciante(profileData);
      } else {
        setAnunciante({
          id: 'credenciado',
          nome_completo: 'Corretor Credenciado Zona Sul',
          telefone: '(21) 99888-7766',
          tipo_anunciante: 'Sou Corretor(a)',
          creci: 'CRECI-RJ 045892/O',
          foto_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
          status_verificacao: 'aprovado'
        });
      }
    } catch (e) {
      console.warn('Usando perfil anunciante padrão:', e);
      setAnunciante({
        id: 'credenciado',
        nome_completo: 'Corretor Credenciado Zona Sul',
        telefone: '(21) 99888-7766',
        tipo_anunciante: 'Sou Corretor(a)',
        creci: 'CRECI-RJ 045892/O',
        foto_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
        status_verificacao: 'aprovado'
      });
    }
  }

  // Busca estritamente no Supabase até 4 imóveis ativos no mesmo bairro ou mesmo tipo (SEM MOCK)
  async function carregarImoveisSimilares(currentImovel) {
    try {
      const { data } = await supabase
        .from('imoveis')
        .select('*')
        .neq('id', currentImovel.id)
        .or(`bairro.eq.${currentImovel.bairro},tipo.eq.${currentImovel.tipo}`)
        .limit(4);

      if (data && data.length > 0) {
        setImoveisSimilares(data);
      } else {
        setImoveisSimilares([]);
      }
    } catch (e) {
      console.warn('Erro ao carregar imóveis similares do Supabase:', e);
      setImoveisSimilares([]);
    }
  }

  function copiarLinkPagina() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }

  function formatarPreco(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor || 0);
  }

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Carregando informações do imóvel...</p>
      </div>
    );
  }

  if (!imovel) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 space-y-4">
          <Home className="w-12 h-12 text-slate-500 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Imóvel Não Encontrado</h1>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            O imóvel solicitado não foi localizado ou pode ter sido removido do nosso catálogo.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-sky-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Catálogo Principal</span>
          </Link>
        </div>
      </div>
    );
  }

  const rawFotos = imovel.fotos && imovel.fotos.length > 0 
    ? imovel.fotos 
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'];

  const fotos = formatR2Urls(rawFotos);

  const fotoPrincipal = fotos[selectedPhotoIndex] || fotos[0];

  // Preço formatado com a modalidade de transação
  let precoTexto = formatarPreco(imovel.preco);
  if (imovel.transacao === 'Temporada') {
    precoTexto = `${formatarPreco(imovel.preco)} / diária`;
  } else if (imovel.transacao === 'Alugar' || imovel.transacao === 'Aluguel') {
    precoTexto = `${formatarPreco(imovel.preco)} / mês`;
  }

  // Telefone para o link do WhatsApp
  const rawPhone = anunciante?.telefone || '(21) 99888-7766';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const whatsappPhoneFormatted = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
  
  // Mensagem pré-formatada do WhatsApp com encodeURIComponent
  const whatsappMessageText = `Olá, vi o anúncio do imóvel ${imovel.titulo} no Imóveis Zona Sul Rio de Janeiro e gostaria de mais informações.`;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappPhoneFormatted}&text=${encodeURIComponent(whatsappMessageText)}`;

  const anunciantePublicId = anunciante?.id || imovel?.usuario_id || 'credenciado';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Top Bar: Botão Voltar & Compartilhar */}
      <div className="flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Catálogo</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={copiarLinkPagina}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-sky-400" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Compartilhar'}</span>
          </button>
        </div>
      </div>

      {/* GALERIA DE FOTOS (FOTO PRINCIPAL + THUMBNAILS DAS IMAGENS DO R2) */}
      <div className="space-y-4">
        {/* Foto Principal */}
        <div 
          className="relative w-full h-[45vh] sm:h-[60vh] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 group cursor-pointer shadow-2xl"
          onClick={() => setModalOpen(true)}
        >
          <img
            src={fotoPrincipal}
            alt={imovel.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

          {/* Badges de Transação e Tipo */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg">
              {imovel.transacao === 'Vender' || imovel.transacao === 'Venda' ? 'Venda' : imovel.transacao}
            </span>
            <span className="bg-slate-900/90 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-700 shadow-lg">
              {imovel.tipo || 'Apartamento'}
            </span>
          </div>

          {/* Botão de Ampliar Fotos */}
          <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 shadow-lg">
            <Camera className="w-4 h-4 text-sky-400" />
            <span>Ver todas as {fotos.length} fotos</span>
          </div>
        </div>

        {/* Mosaico / Carrossel de Thumbnails */}
        {fotos.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {fotos.map((foto, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPhotoIndex(idx)}
                className={`relative w-24 h-20 sm:w-32 sm:h-24 rounded-2xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  selectedPhotoIndex === idx ? 'border-sky-500 scale-105 shadow-md shadow-sky-500/20' : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={foto} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CONTEÚDO PRINCIPAL (INFORMAÇÕES + SIDEBAR ANUNCIANTE & WHATSAPP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Coluna Esquerda: Título, Valores, Atributos & Descrição Detalhada */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Header do Imóvel */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-sky-400" />
              <span>{imovel.bairro || 'Zona Sul'}, Rio de Janeiro</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {imovel.titulo}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-t border-slate-800/80 pt-4">
              <div>
                <span className="text-xs text-slate-400 font-medium block mb-1">Valor do Imóvel</span>
                <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                  {precoTexto}
                </span>
              </div>

              {(imovel.condominio > 0 || imovel.iptu > 0) && (
                <div className="flex gap-4 text-xs font-medium text-slate-300 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-2xl">
                  {imovel.condominio > 0 && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">Condomínio</span>
                      <span>R$ {imovel.condominio}</span>
                    </div>
                  )}
                  {imovel.iptu > 0 && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">IPTU</span>
                      <span>R$ {imovel.iptu}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Atributos Técnicos em Destaque (Quartos, Banheiros, Metragem, Vagas) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Características & Ficha Técnica
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Área Útil</span>
                  <span className="text-base font-bold text-white">{imovel.area_m2 || 0} m²</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Quartos</span>
                  <span className="text-base font-bold text-white">{imovel.quartos || 0}</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <Bath className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Banheiros</span>
                  <span className="text-base font-bold text-white">{imovel.banheiros || 0}</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Vagas</span>
                  <span className="text-base font-bold text-white">{imovel.vagas || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* DESCRIÇÃO COMPLETA PREENCHIDA PELO ANUNCIANTE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Building className="w-5 h-5 text-sky-400" />
              Descrição Detalhada do Imóvel
            </h2>
            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line border-t border-slate-800 pt-4">
              {imovel.descricao || 'Nenhuma descrição adicional foi fornecida pelo anunciante.'}
            </div>
          </div>

        </div>

        {/* Coluna Direita: Card do Anunciante & Botão WhatsApp */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="sticky top-28 space-y-6">
            
            {/* CARD DO ANUNCIANTE COM BOTÃO WHATSAPP */}
            <div className="bg-slate-900/95 border border-sky-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-sky-500/40 shrink-0">
                  <img
                    src={formatR2Url(anunciante?.foto_url) || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'}
                    alt={anunciante?.nome_completo || 'Anunciante'}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-white">{anunciante?.nome_completo || 'Anunciante Credenciado'}</h3>
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-xs text-sky-400 font-semibold">{anunciante?.tipo_anunciante || 'Sou Corretor(a)'}</p>
                  {anunciante?.creci && (
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{anunciante.creci}</span>
                  )}
                </div>
              </div>

              {/* BOTÃO EM DESTAQUE DO WHATSAPP (MENSAGEM PRÉ-FORMATADA) */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>Falar no WhatsApp</span>
              </a>

              {/* LINK DISCRETO PARA O PERFIL PÚBLICO DO ANUNCIANTE (SEM REDIRECIONAR PARA LOGIN) */}
              <div className="text-center pt-2 border-t border-slate-800">
                <Link
                  href={`/anunciante/${anunciantePublicId}`}
                  className="text-xs text-slate-400 hover:text-sky-400 font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Ver perfil e outros imóveis deste anunciante</span>
                </Link>
              </div>

            </div>

            {/* SELO DE SEGURANÇA E SUPORTE DA PLATAFORMA */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 leading-relaxed space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Atendimento Direto & Seguro</span>
              </div>
              <p className="text-[11px]">
                Ao entrar em contato pelo WhatsApp, você trata diretamente com o anunciante verificado pelo <strong>Imóveis Zona Sul Rio de Janeiro</strong>.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* BLOCO DE IMÓVEIS SIMILARES REAIS (EXIBIDO APENAS SE HOUVER IMÓVEIS REAIS CADASTRADOS NO SUPABASE) */}
      {imoveisSimilares && imoveisSimilares.length > 0 && (
        <div className="border-t border-slate-800/80 pt-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Imóveis que você também pode gostar
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Opções semelhantes em {imovel.bairro} e arredores da Zona Sul
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:underline font-bold"
            >
              <span>Ver todo o catálogo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {imoveisSimilares.map((item) => {
              const itemFotos = formatR2Urls(item.fotos || []);
              const itemCapa = itemFotos.length > 0 ? itemFotos[0] : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';
              const itemPreco = formatarPreco(item.preco);

              return (
                <div key={item.id} className="glass-card rounded-2xl overflow-hidden flex flex-col group border border-slate-800/80 hover:border-sky-500/40 transition-all duration-300">
                  <div className="relative h-44 w-full bg-slate-950">
                    <img src={itemCapa} alt={item.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                      <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">
                        {item.transacao || 'Venda'}
                      </span>
                      <span className="bg-slate-900/90 text-slate-200 text-[10px] px-2 py-0.5 rounded-lg font-medium border border-slate-700">
                        {item.tipo || 'Apartamento'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-grow space-y-2">
                    <span className="text-sky-400 text-xs font-semibold">{item.bairro || 'Zona Sul'}</span>
                    <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug">{item.titulo}</h3>
                    <p className="text-base font-black text-emerald-400">{itemPreco}</p>

                    {/* Botão Saiba Mais nos Cards Similares */}
                    <Link
                      href={`/imovel/${item.id}`}
                      className="w-full py-2 px-3 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/30 hover:border-sky-500 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 group/btn cursor-pointer mt-1"
                    >
                      <span>Saiba Mais</span>
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>

                    <div className="mt-auto border-t border-slate-800 pt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{item.area_m2 || 0} m²</span>
                      <span>{item.quartos || 0} qts</span>
                      <span>{item.banheiros || 0} banh</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BARRA FIXA MOBILE PARA ACESSO DIRETO AO WHATSAPP */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-slate-950/95 border-t border-slate-800 p-3 backdrop-blur-lg shadow-2xl">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>Conversar no WhatsApp com Anunciante</span>
        </a>
      </div>

      {/* MODAL AMPLIADO DE FOTOS */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
          <button
            onClick={() => setModalOpen(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-900/80 border border-slate-800 cursor-pointer z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl w-full flex flex-col items-center">
            <div className="relative w-full h-[70vh] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800">
              <img
                src={fotoPrincipal}
                alt={imovel.titulo}
                className="w-full h-full object-contain"
              />

              {fotos.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : fotos.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-950/80 hover:bg-slate-900 text-white p-3 rounded-full border border-slate-800 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    onClick={() => setSelectedPhotoIndex((prev) => (prev < fotos.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-950/80 hover:bg-slate-900 text-white p-3 rounded-full border border-slate-800 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 text-xs font-semibold text-slate-400 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
              Foto {selectedPhotoIndex + 1} de {fotos.length}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
