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
        titulo: 'Cobertura Duplex com Piscina e Vista Cristo Redentor',
        descricao: 'Exclusiva cobertura no Leblon com terraço privativo, churrasqueira e piscina.',
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
          'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
        ]
      },
      {
        id: 103,
        titulo: 'Studio Moderno Reformado em Copacabana',
        descricao: 'Ótima oportunidade para investimento ou moradia a 2 quadras da praia.',
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
        descricao: 'Vila silenciosa, arborizada e segura no coração do Jardim Botânico.',
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

    // Mapeamento: "Comprar" selecionado no filtro consulta "Vender" / "Venda" no banco de dados
    const matchTransacao = selectedTransacao === 'Todos' || 
      imovel.transacao === selectedTransacao ||
      (selectedTransacao === 'Comprar' && (imovel.transacao === 'Vender' || imovel.transacao === 'Venda' || imovel.transacao === 'Comprar')) ||
      (selectedTransacao === 'Alugar' && (imovel.transacao === 'Aluguel' || imovel.transacao === 'Alugar')) ||
      (selectedTransacao === 'Temporada' && imovel.transacao === 'Temporada');
    
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
      
      {/* Select Dropdown Filters Bar (Com grande destaque / Fundo Branco) */}
      <div className="bg-white border-2 border-sky-400/50 rounded-3xl p-6 sm:p-8 mb-10 shadow-2xl shadow-sky-500/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <Filter className="w-5 h-5 text-sky-600" />
            <span>Filtros de Seleção</span>
          </div>

          {(selectedTransacao !== 'Todos' || selectedTipo !== 'Todos' || selectedBairro !== 'Todos' || selectedQuartos !== 'Todos' || searchTerm !== '') && (
            <button
              onClick={resetFiltros}
              className="text-xs text-sky-600 hover:text-sky-800 font-bold underline underline-offset-4 cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Grid of 4 Select Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Transação (Comprar mapeado para Vender no banco) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-sky-600" />
              Transação
            </label>
            <select
              value={selectedTransacao}
              onChange={(e) => setSelectedTransacao(e.target.value)}
              className="bg-slate-50 text-slate-900 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 hover:border-sky-400 transition-all cursor-pointer shadow-sm"
            >
              <option value="Todos">Transação</option>
              <option value="Comprar">Comprar</option>
              <option value="Alugar">Alugar</option>
              <option value="Temporada">Temporada</option>
            </select>
          </div>

          {/* 2. Tipo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Building className="w-3.5 h-3.5 text-sky-600" />
              Tipo do Imóvel
            </label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="bg-slate-50 text-slate-900 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 hover:border-sky-400 transition-all cursor-pointer shadow-sm"
            >
              <option value="Todos">Tipo</option>
              <option value="Apartamento">Apartamento</option>
              <option value="Cobertura">Cobertura</option>
              <option value="Casa">Casa</option>
              <option value="Studio">Studio</option>
            </select>
          </div>

          {/* 3. Bairro */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              Bairro (Zona Sul)
            </label>
            <select
              value={selectedBairro}
              onChange={(e) => setSelectedBairro(e.target.value)}
              className="bg-slate-50 text-slate-900 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 hover:border-sky-400 transition-all cursor-pointer shadow-sm"
            >
              <option value="Todos">Bairro</option>
              {BAIRROS_ZONA_SUL.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* 4. Quartos */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Bed className="w-3.5 h-3.5 text-sky-600" />
              Quartos
            </label>
            <select
              value={selectedQuartos}
              onChange={(e) => setSelectedQuartos(e.target.value)}
              className="bg-slate-50 text-slate-900 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 hover:border-sky-400 transition-all cursor-pointer shadow-sm"
            >
              <option value="Todos">Quartos</option>
              <option value="1">1+ Quarto</option>
              <option value="2">2+ Quartos</option>
              <option value="3">3+ Quartos</option>
              <option value="4">4+ Quartos</option>
            </select>
          </div>

        </div>

        {/* Input de Busca Textual */}
        <div className="mt-4 pt-4 border-t border-slate-100 relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ou busque por palavra-chave (ex: mar, terraço, reformado)..."
            className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Título do Catálogo */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Imóveis Exclusivos
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {imoveisFiltrados.length} disponíveis
            </span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Confira as melhores ofertas no litoral da Zona Sul do Rio de Janeiro
          </p>
        </div>
      </div>

      {/* Grid de Imóveis */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-2xl h-96 animate-pulse p-4 space-y-4">
              <div className="bg-slate-800 h-48 rounded-xl" />
              <div className="bg-slate-800 h-4 w-3/4 rounded" />
              <div className="bg-slate-800 h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : imoveisFiltrados.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400">
            <Home className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Nenhum imóvel encontrado</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Não encontramos nenhum imóvel com a combinação de filtros selecionada. Tente ajustar os parâmetros ou limpar os filtros.
          </p>
          <button
            onClick={resetFiltros}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-sky-500/20 cursor-pointer"
          >
            Limpar Filtros de Busca
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {imoveisFiltrados.map((imovel) => {
            const fotos = imovel.fotos || [];
            const capa = fotos.length > 0 ? fotos[0] : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';
            const precoFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(imovel.preco || 0);

            let labelPreco = precoFormatted;
            if (imovel.transacao === 'Temporada') {
              labelPreco = `${precoFormatted} / diária`;
            } else if (imovel.transacao === 'Alugar' || imovel.transacao === 'Aluguel') {
              labelPreco = `${precoFormatted} / mês`;
            }

            return (
              <div key={imovel.id} className="glass-card rounded-2xl overflow-hidden flex flex-col group border border-slate-800/80 hover:border-sky-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/5">
                
                {/* Capa & Badge */}
                <div className="relative h-56 w-full bg-slate-950 overflow-hidden cursor-pointer" onClick={() => abrirGaleria(fotos)}>
                  <img 
                    src={capa} 
                    alt={imovel.titulo} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  
                  {/* Badges de Transação & Tipo */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md">
                      {imovel.transacao === 'Vender' || imovel.transacao === 'Venda' ? 'Venda' : imovel.transacao}
                    </span>
                    <span className="bg-slate-900/90 text-slate-200 text-[11px] px-2.5 py-1 rounded-lg font-medium border border-slate-700 shadow-md">
                      {imovel.tipo || 'Apartamento'}
                    </span>
                  </div>

                  {/* Fotos counter */}
                  {fotos.length > 0 && (
                    <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-800 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-sky-400" />
                      <span>{fotos.length}</span>
                    </div>
                  )}
                </div>

                {/* Conteúdo do Card */}
                <div className="p-5 flex flex-col flex-grow space-y-3">
                  <div className="flex items-center gap-1.5 text-sky-400 text-xs font-semibold">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{imovel.bairro || 'Zona Sul'}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-sky-300 transition-colors">
                    {imovel.titulo}
                  </h3>

                  <p className="text-xl font-black text-emerald-400">
                    {labelPreco}
                  </p>

                  {(imovel.condominio > 0 || imovel.iptu > 0) && (
                    <div className="flex gap-3 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                      {imovel.condominio > 0 && <span>Cond: R$ {imovel.condominio}</span>}
                      {imovel.iptu > 0 && <span>IPTU: R$ {imovel.iptu}</span>}
                    </div>
                  )}

                  {/* Atributos do Imóvel */}
                  <div className="mt-auto border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-300 font-medium">
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

              </div>
            );
          })}
        </div>
      )}

      {/* GALERIA MODAL DE FOTOS */}
      {modalOpen && currentGallery.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
          <button
            onClick={() => setModalOpen(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-900/80 border border-slate-800 cursor-pointer z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <div className="relative w-full h-[65vh] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
              <img
                src={currentGallery[currentPhotoIndex]}
                alt={`Foto ${currentPhotoIndex + 1}`}
                className="w-full h-full object-contain"
              />

              {currentGallery.length > 1 && (
                <>
                  <button
                    onClick={() => mudarFoto(-1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-950/80 hover:bg-slate-900 text-white p-3 rounded-full border border-slate-800 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    onClick={() => mudarFoto(1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-950/80 hover:bg-slate-900 text-white p-3 rounded-full border border-slate-800 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 text-xs font-semibold text-slate-400 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
              Foto {currentPhotoIndex + 1} de {currentGallery.length}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
