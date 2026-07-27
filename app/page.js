'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Maximize2, 
  Camera, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Building,
  Tag,
  Home
} from 'lucide-react';

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

export default function CatalogPage() {
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 4 Select Dropdown Filters
  const [selectedTransacao, setSelectedTransacao] = useState('Todos');
  const [selectedTipo, setSelectedTipo] = useState('Todos');
  const [selectedBairro, setSelectedBairro] = useState('Todos');
  const [selectedQuartos, setSelectedQuartos] = useState('Todos');

  // Estado da Galeria Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [currentGallery, setCurrentGallery] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    carregarImoveis();
  }, []);

  async function carregarImoveis() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, usando dados iniciais:', error);
        setImoveis(getMockImoveis());
      } else if (data && data.length > 0) {
        setImoveis(data);
      } else {
        setImoveis(getMockImoveis());
      }
    } catch (err) {
      console.error('Erro ao buscar imóveis:', err);
      setImoveis(getMockImoveis());
    } finally {
      setLoading(false);
    }
  }

  function getMockImoveis() {
    return [
      {
        id: 101,
        titulo: 'Apartamento de Alto Padrão Quadrilátero de Ipanema',
        descricao: 'Amplo apartamento com vista lateral para o mar, reformado por arquiteto renomado.',
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
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
        ]
      },
      {
        id: 102,
        titulo: 'Cobertura Duplex com Piscina e Vista Leblon',
        descricao: 'Exclusiva cobertura duplex a 2 quadras da praia com terraço gourmet privativo.',
        tipo: 'Cobertura',
        transacao: 'Vender',
        preco: 6200000,
        condominio: 4100,
        iptu: 1200,
        bairro: 'Leblon',
        quartos: 4,
        banheiros: 5,
        vagas: 3,
        area_m2: 280,
        fotos: [
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80'
        ]
      },
      {
        id: 103,
        titulo: 'Studio Moderno Decorado Próximo ao Metrô',
        descricao: 'Excelente opção para morar ou investir em locação por temporada.',
        tipo: 'Studio',
        transacao: 'Alugar',
        preco: 4500,
        condominio: 680,
        iptu: 150,
        bairro: 'Copacabana',
        quartos: 1,
        banheiros: 1,
        vagas: 1,
        area_m2: 42,
        fotos: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
        ]
      },
      {
        id: 104,
        titulo: 'Imóvel Ensolarado com Vista Cristo Redentor',
        descricao: 'Apartamento aconchegante cercado pelo verde do Jardim Botânico.',
        tipo: 'Apartamento',
        transacao: 'Vender',
        preco: 1750000,
        condominio: 1350,
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
        descricao: 'Lindo apartamento totalmente equipado para estadias curtas a 50 metros do Posto 4.',
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
  }

  // Filtragem dos Imóveis com base nos 4 Selects e Busca
  const imoveisFiltrados = imoveis.filter((imovel) => {
    const matchSearch = searchTerm === '' || 
      (imovel.bairro && imovel.bairro.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (imovel.tipo && imovel.tipo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (imovel.descricao && imovel.descricao.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchTransacao = selectedTransacao === 'Todos' || 
      imovel.transacao === selectedTransacao ||
      (selectedTransacao === 'Vender' && (imovel.transacao === 'Venda' || imovel.transacao === 'Vender')) ||
      (selectedTransacao === 'Alugar' && (imovel.transacao === 'Aluguel' || imovel.transacao === 'Alugar'));
    const matchTipo = selectedTipo === 'Todos' || imovel.tipo === selectedTipo;
    const matchBairro = selectedBairro === 'Todos' || imovel.bairro === selectedBairro;
    const matchQuartos = selectedQuartos === 'Todos' || (imovel.quartos && imovel.quartos >= parseInt(selectedQuartos, 10));

    return matchSearch && matchTransacao && matchTipo && matchBairro && matchQuartos;
  });

  function abrirGaleria(fotos) {
    if (!fotos || fotos.length === 0) return;
    setCurrentGallery(fotos);
    setCurrentPhotoIndex(0);
    setModalOpen(true);
  }

  function mudarFoto(delta) {
    if (currentGallery.length === 0) return;
    setCurrentPhotoIndex((prev) => {
      let next = prev + delta;
      if (next < 0) next = currentGallery.length - 1;
      if (next >= currentGallery.length) next = 0;
      return next;
    });
  }

  function resetFiltros() {
    setSearchTerm('');
    setSelectedTransacao('Todos');
    setSelectedTipo('Todos');
    setSelectedBairro('Todos');
    setSelectedQuartos('Todos');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Select Dropdown Filters Bar (Transacao | Tipo | Bairro | Quartos) */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 mb-8 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
            <Filter className="w-4 h-4 text-sky-400" />
            <span>Filtros de Seleção</span>
          </div>

          {(selectedTransacao !== 'Todos' || selectedTipo !== 'Todos' || selectedBairro !== 'Todos' || selectedQuartos !== 'Todos' || searchTerm !== '') && (
            <button
              onClick={resetFiltros}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-4"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Grid of 4 Select Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Transação */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-sky-400" />
              Transação
            </label>
            <select
              value={selectedTransacao}
              onChange={(e) => setSelectedTransacao(e.target.value)}
              className="bg-slate-950 text-slate-100 border border-slate-700/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="Todos">Todas as Transações</option>
              <option value="Vender">Vender</option>
              <option value="Alugar">Alugar</option>
              <option value="Temporada">Temporada</option>
            </select>
          </div>

          {/* 2. Tipo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Building className="w-3.5 h-3.5 text-sky-400" />
              Tipo de Imóvel
            </label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="bg-slate-950 text-slate-100 border border-slate-700/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="Todos">Todos os Tipos</option>
              <option value="Apartamento">Apartamento</option>
              <option value="Cobertura">Cobertura</option>
              <option value="Casa">Casa</option>
              <option value="Studio">Studio</option>
            </select>
          </div>

          {/* 3. Bairro */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              Bairro
            </label>
            <select
              value={selectedBairro}
              onChange={(e) => setSelectedBairro(e.target.value)}
              className="bg-slate-950 text-slate-100 border border-slate-700/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="Todos">Todos os Bairros da Zona Sul</option>
              {BAIRROS_ZONA_SUL.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* 4. Quartos */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Bed className="w-3.5 h-3.5 text-sky-400" />
              Quartos
            </label>
            <select
              value={selectedQuartos}
              onChange={(e) => setSelectedQuartos(e.target.value)}
              className="bg-slate-950 text-slate-100 border border-slate-700/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="Todos">Qualquer quant. de quartos</option>
              <option value="1">1+ Quarto</option>
              <option value="2">2+ Quartos</option>
              <option value="3">3+ Quartos</option>
              <option value="4">4+ Quartos</option>
            </select>
          </div>

        </div>
      </div>

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 mb-8 text-center bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 border border-slate-800 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent pointer-events-none" />
        
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-4">
          <MapPin className="w-3.5 h-3.5" />
          Exclusividade na Zona Sul do Rio
        </span>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
          Encontre seu próximo imóvel em <br />
          <span className="gradient-text">Copacabana, Ipanema e Leblon</span>
        </h1>

        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
          Catálogo atualizado diariamente com os melhores apartamentos, coberturas e imóveis de alto padrão na Zona Sul carioca.
        </p>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Busque por rua, bairro ou palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl pl-12 pr-4 py-4 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm shadow-xl backdrop-blur-md transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-4 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Imóveis Grid Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Imóveis Disponíveis
          <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
            {imoveisFiltrados.length} {imoveisFiltrados.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </h2>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-slate-900 border border-slate-800 rounded-2xl h-96 animate-pulse" />
          ))}
        </div>
      ) : imoveisFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-3xl">
          <p className="text-slate-400 text-base mb-3">Nenhum imóvel encontrado com os filtros selecionados.</p>
          <button 
            onClick={resetFiltros}
            className="text-xs text-sky-400 hover:underline font-semibold"
          >
            Resetar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {imoveisFiltrados.map((imovel) => {
            const fotos = imovel.fotos || [];
            const capa = fotos.length > 0 ? fotos[0] : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';
            const precoFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(imovel.preco || 0);

            return (
              <article 
                key={imovel.id} 
                className="glass-card rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 cursor-pointer"
                onClick={() => abrirGaleria(fotos.length > 0 ? fotos : [capa])}
              >
                {/* Card Image Cover */}
                <div className="relative h-60 w-full overflow-hidden bg-slate-950">
                  <img
                    src={capa}
                    alt={`${imovel.tipo || 'Imóvel'} em ${imovel.bairro || 'Zona Sul'}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                      imovel.transacao === 'Temporada' 
                        ? 'bg-amber-600/90 text-white' 
                        : (imovel.transacao === 'Alugar' || imovel.transacao === 'Aluguel')
                          ? 'bg-indigo-600/90 text-white' 
                          : 'bg-emerald-600/90 text-white'
                    }`}>
                      {imovel.transacao || 'Vender'}
                    </span>
                    <span className="bg-slate-900/90 backdrop-blur-md text-slate-200 text-[11px] px-2.5 py-1 rounded-lg font-medium border border-slate-700/60">
                      {imovel.tipo || 'Apartamento'}
                    </span>
                  </div>

                  {fotos.length > 0 && (
                    <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/10">
                      <Camera className="w-3.5 h-3.5 text-sky-400" />
                      {fotos.length}
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center gap-1.5 text-sky-400 text-xs font-semibold mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{imovel.bairro || 'Zona Sul'}</span>
                  </div>

                  {/* Nome limpo e direto no formato Tipo em Bairro */}
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                    {imovel.tipo || 'Imóvel'} em {imovel.bairro || 'Zona Sul'}
                  </h3>

                  <p className="text-2xl font-black text-emerald-400 mb-4">
                    {precoFormatted}
                    {(imovel.transacao === 'Alugar' || imovel.transacao === 'Aluguel') && <span className="text-xs text-slate-400 font-normal"> / mês</span>}
                    {imovel.transacao === 'Temporada' && <span className="text-xs text-slate-400 font-normal"> / diária</span>}
                  </p>

                  {/* Features details */}
                  <div className="mt-auto border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-300 font-medium">
                    <div className="flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{imovel.area_m2 || 0} m²</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-slate-400" />
                      <span>{imovel.quartos || 0} qts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5 text-slate-400" />
                      <span>{imovel.banheiros || 0} banh</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                      <span>{imovel.vagas || 0} vag</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Photo Gallery Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <button 
            onClick={() => setModalOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl w-full flex flex-col items-center">
            <div className="relative w-full h-[65vh] flex items-center justify-center">
              <img 
                src={currentGallery[currentPhotoIndex]} 
                alt="Foto em alta definição"
                className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
              />

              {currentGallery.length > 1 && (
                <>
                  <button 
                    onClick={() => mudarFoto(-1)}
                    className="absolute left-4 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button 
                    onClick={() => mudarFoto(1)}
                    className="absolute right-4 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {currentGallery.length > 1 && (
              <div className="mt-4 text-xs font-semibold text-slate-300 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">
                {currentPhotoIndex + 1} de {currentGallery.length}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
