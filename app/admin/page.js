'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Loader2
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

export default function AdminPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'Apartamento',
    transacao: 'Venda',
    preco: '',
    condominio: '',
    iptu: '',
    bairro: 'Ipanema',
    quartos: '2',
    banheiros: '2',
    vagas: '1',
    area_m2: '80',
    fotos: []
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      try {
        // 1. Tenta obter URL pré-assinada da rota /api/upload (Cloudflare R2)
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || 'image/webp'
          })
        });

        const data = await res.json();

        if (res.ok && data.uploadUrl && data.publicUrl) {
          // 2. Fazer o PUT da imagem diretamente no Cloudflare R2
          const uploadRes = await fetch(data.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type || 'image/webp' },
            body: file
          });

          if (uploadRes.ok) {
            uploadedUrls.push(data.publicUrl);
          } else {
            // Se falhar o R2 por falta de credenciais privadas, cria URL temporária de preview
            uploadedUrls.push(URL.createObjectURL(file));
          }
        } else {
          // Fallback gracioso para preview de desenvolvimento se R2 não estiver totalmente configurado no env
          uploadedUrls.push(URL.createObjectURL(file));
        }
      } catch (err) {
        console.warn('Fallback de imagem devido a erro de conexão:', err);
        uploadedUrls.push(URL.createObjectURL(file));
      }
    }

    setFormData((prev) => ({
      ...prev,
      fotos: [...prev.fotos, ...uploadedUrls]
    }));
    setUploading(false);
  }

  function removerFoto(index) {
    setFormData((prev) => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFeedback(null);

    if (!formData.titulo || !formData.preco) {
      setFeedback({ type: 'error', message: 'Preencha ao menos o Título e o Preço do imóvel.' });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/salvar-imovel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: 'Imóvel cadastrado com sucesso no catálogo!' });
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Erro ao cadastrar imóvel no Supabase.' });
      }
    } catch (err) {
      console.error('Erro no envio do formulário:', err);
      setFeedback({ type: 'error', message: 'Erro na conexão com o servidor.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Back button */}
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Catálogo
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Cadastrar Novo Imóvel</h1>
                <p className="text-slate-400 text-xs">Preencha os dados do imóvel na Zona Sul do Rio de Janeiro</p>
              </div>
            </div>

            {feedback && (
              <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm font-medium ${
                feedback.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
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
                    <option value="Venda">Venda</option>
                    <option value="Aluguel">Aluguel</option>
                  </select>
                </div>
              </div>

              {/* Preço, Condomínio, IPTU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    name="preco"
                    value={formData.preco}
                    onChange={handleChange}
                    placeholder="2500000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Condomínio (R$)
                  </label>
                  <input
                    type="number"
                    name="condominio"
                    value={formData.condominio}
                    onChange={handleChange}
                    placeholder="1800"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    IPTU (R$)
                  </label>
                  <input
                    type="number"
                    name="iptu"
                    value={formData.iptu}
                    onChange={handleChange}
                    placeholder="450"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

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
                  rows={3}
                  value={formData.descricao}
                  onChange={handleChange}
                  placeholder="Detalhes sobre a vista, acabamentos, posição do sol, condomínio e localização..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Upload de Fotos (Cloudflare R2) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Fotos do Imóvel (Cloudflare R2 Storage)
                </label>

                <div className="relative border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 text-center bg-slate-950/50 transition-colors group cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-sky-400 transition-colors" />
                    )}
                    <span className="text-xs font-semibold text-slate-300">
                      {uploading ? 'Processando e enviando mídias...' : 'Clique ou arraste imagens aqui para enviar'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Formatos aceitos: JPG, PNG, WEBP (convertidos automaticamente)
                    </span>
                  </div>
                </div>

                {/* Previews das fotos */}
                {formData.fotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {formData.fotos.map((url, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden h-24 border border-slate-800 group">
                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removerFoto(idx)}
                          className="absolute top-1 right-1 bg-rose-600/90 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Publicando no Supabase...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-5 h-5" />
                    <span>Publicar Imóvel na Zona Sul</span>
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Pré-visualização do Card em Tempo Real</span>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden flex flex-col border border-sky-500/30">
              <div className="relative h-60 w-full bg-slate-950">
                <img
                  src={formData.fotos[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'}
                  alt="Preview"
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
                  {formData.preco ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(formData.preco) : 'R$ 0,00'}
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
    </div>
  );
}
