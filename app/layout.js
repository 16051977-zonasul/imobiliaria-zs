import './globals.css';
import Link from 'next/link';
import { Building2, PlusCircle, Compass, Phone, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Tô Aqui No Rio | Imóveis Exclusivos na Zona Sul do RJ',
  description: 'Encontre os melhores apartamentos, coberturas e imóveis de luxo em Copacabana, Ipanema, Leblon, Botafogo e em toda a Zona Sul do Rio de Janeiro.',
  keywords: 'Imóveis Rio de Janeiro, Zona Sul RJ, Copacabana, Ipanema, Leblon, Botafogo, Apartamentos Rio, Tô Aqui No Rio',
  openGraph: {
    title: 'Tô Aqui No Rio | Imóveis na Zona Sul do Rio de Janeiro',
    description: 'Catálogo de imóveis selecionados na Zona Sul do RJ.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark scroll-smooth">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-sky-500 selection:text-white">
        
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 glass-nav">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
                  Tô Aqui <span className="gradient-text">No Rio</span>
                </span>
                <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-semibold -mt-1">
                  Zona Sul • RJ
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-4">
              <Link 
                href="/" 
                className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-sky-400 transition-colors px-3 py-2"
              >
                <Compass className="w-4 h-4" />
                Catálogo
              </Link>

              <Link 
                href="/admin" 
                className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Anunciar Imóvel</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950 py-12 mt-20 text-slate-400 text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white text-base">Tô Aqui No Rio</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Plataforma imobiliária especializada nos bairros mais nobres da Zona Sul do Rio de Janeiro. Conectando compradores e corretores com transparência e agilidade.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">Bairros em Destaque</h3>
              <ul className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <li>• Copacabana</li>
                <li>• Ipanema</li>
                <li>• Leblon</li>
                <li>• Botafogo</li>
                <li>• Flamengo</li>
                <li>• Jardim Botânico</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">Segurança e Suporte</h3>
              <div className="space-y-2 text-xs">
                <p className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Imóveis e corretores verificados
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-sky-400" />
                  Atendimento Zona Sul RJ
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-900 mt-8 pt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Tô Aqui No Rio — Todos os direitos reservados.
          </div>
        </footer>

      </body>
    </html>
  );
}
