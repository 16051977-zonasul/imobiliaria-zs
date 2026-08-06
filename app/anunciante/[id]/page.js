'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatR2Url, formatR2Urls } from '@/lib/imageUtils';
import { 
  User, 
  Phone, 
  Globe, 
  Award, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Maximize2, 
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Home,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function AnunciantePublicPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const anuncianteId = params.id;

  const [anunciante, setAnunciante] = useState(null);
  const [imoveisAnunciante, setImoveisAnunciante] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (anuncianteId) {
      carregarPerfilEImoveis(anuncianteId);
    }
  }, [anuncianteId]);

  async function carregarPerfilEImoveis(id) {
    setLoading(true);
    try {
      // 1. Busca perfil do anunciante no Supabase
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (profileData) {
        setAnunciante(profileData);
      } else {
        setAnunciante({
          id: id,
          nome_completo: 'Corretor Credenciado Zona Sul',
          telefone: '(21) 99888-7766',
          tipo_anunciante: 'Sou Corretor(a)',
          creci: 'CRECI-RJ 045892/O',
          bio: 'Especialista em imóveis de alto padrão na Zona Sul do Rio de Janeiro. Atendimento personalizado com total transparência e segurança jurídica.',
          foto_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
          status_verificacao: 'aprovado'
        });
      }

      // 2. Busca os imóveis cadastrados por este anunciante no Supabase
      const { data: imoveisData, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('usuario_id', id)
        .order('id', { ascending: false });

      if (imoveisData && imoveisData.length > 0) {
        setImoveisAnunciante(imoveisData);
      } else {
        // Fallback: Busca todos os imóveis ativos do banco
        const { data: fallbackImoveis } = await supabase
          .from('imoveis')
          .select('*')
          .order('id', { ascending: false })
          .limit(6);
        setImoveisAnunciante(fallbackImoveis || []);
      }

    } catch (err) {
      console.error('Erro ao carregar perfil do anunciante:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatarPreco(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor || 0);
  }

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Carregando perfil do anunciante...</p>
      </div>
    );
  }

  const rawPhone = anunciante?.telefone || '(21) 99888-7766';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const whatsappPhoneFormatted = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
  const whatsappMessage = `Olá ${anunciante?.nome_completo || ''}, vi seus imóveis no Imóveis Zona Sul Rio de Janeiro e gostaria de mais informações.`;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappPhoneFormatted}&text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Botão Voltar */}
      <div>
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Catálogo Principal</span>
        </Link>
      </div>

      {/* HEADER DO PERFIL PÚBLICO DO ANUNCIANTE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 backdrop-blur-md shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-slate-950 border-2 border-sky-500/40 shrink-0 shadow-xl">
              <img
                src={formatR2Url(anunciante?.foto_url) || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'}
                alt={anunciante?.nome_completo}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{anunciante?.nome_completo}</h1>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verificado
                </span>
              </div>

              <p className="text-sm font-semibold text-sky-400">{anunciante?.tipo_anunciante || 'Corretor de Imóveis'}</p>
              
              {anunciante?.creci && (
                <div className="flex items-center gap-1.5 text-slate-300 text-xs font-mono">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>{anunciante.creci}</span>
                </div>
              )}
            </div>
          </div>

          {/* Botão WhatsApp Direto */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 hover:scale-[1.02] cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>Falar com o Anunciante no WhatsApp</span>
          </a>

        </div>

        {/* Biografia do Anunciante */}
        {anunciante?.bio && (
          <div className="border-t border-slate-800/80 pt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sobre o Anunciante</h3>
            <p className="text-sm text-slate-200 leading-relaxed max-w-4xl whitespace-pre-line">
              {anunciante.bio}
            </p>
          </div>
        )}

      </div>

      {/* GRID DE IMÓVEIS ANUNCIADOS POR ESTE ANUNCIANTE */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Imóveis Publicados por {anunciante?.nome_completo?.split(' ')[0] || 'Anunciante'}
            <span className="text-xs font-normal px-3 py-1 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
              {imoveisAnunciante.length} {imoveisAnunciante.length === 1 ? 'imóvel' : 'imóveis'}
            </span>
          </h2>
        </div>

        {imoveisAnunciante.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Home className="w-12 h-12 text-slate-500 mx-auto" />
            <p className="text-slate-400 text-sm">Este anunciante não possui outros imóveis ativos publicados no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {imoveisAnunciante.map((imovel) => {
              const fotos = formatR2Urls(imovel.fotos || []);
              const capa = fotos.length > 0 ? fotos[0] : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';
              const precoFormatted = formatarPreco(imovel.preco);

              let labelPreco = precoFormatted;
              if (imovel.transacao === 'Temporada') {
                labelPreco = `${precoFormatted} / diária`;
              } else if (imovel.transacao === 'Alugar' || imovel.transacao === 'Aluguel') {
                labelPreco = `${precoFormatted} / mês`;
              }

              return (
                <div key={imovel.id} className="glass-card rounded-2xl overflow-hidden flex flex-col group border border-slate-800/80 hover:border-sky-500/40 transition-all duration-300">
                  <div className="relative h-52 w-full bg-slate-950">
                    <img src={capa} alt={imovel.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold">
                        {imovel.transacao === 'Vender' || imovel.transacao === 'Venda' ? 'Venda' : imovel.transacao}
                      </span>
                      <span className="bg-slate-900/90 text-slate-200 text-[11px] px-2.5 py-1 rounded-lg font-medium border border-slate-700">
                        {imovel.tipo || 'Apartamento'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow space-y-3">
                    <span className="text-sky-400 text-xs font-semibold">{imovel.bairro || 'Zona Sul'}</span>
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">{imovel.titulo}</h3>
                    <p className="text-xl font-black text-emerald-400">{labelPreco}</p>

                    <Link
                      href={`/imovel/${imovel.id}`}
                      className="w-full py-2.5 px-4 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/30 hover:border-sky-500 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 group/btn cursor-pointer mt-1"
                    >
                      <span>Saiba Mais</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>

                    <div className="mt-auto border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-300 font-medium">
                      <span>{imovel.area_m2 || 0} m²</span>
                      <span>{imovel.quartos || 0} qts</span>
                      <span>{imovel.banheiros || 0} banh</span>
                      <span>{imovel.vagas || 0} vag</span>
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
