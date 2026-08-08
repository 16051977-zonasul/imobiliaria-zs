import './globals.css';
import Header from './Header';
import { Building2, Phone, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Imóveis Zona Sul Rio de Janeiro | Copacabana, Ipanema, Leblon',
  description: 'Encontre os melhores apartamentos, coberturas e imóveis de luxo em Copacabana, Ipanema, Leblon, Botafogo e em toda a Zona Sul do Rio de Janeiro.',
  keywords: 'Imóveis Rio de Janeiro, Zona Sul RJ, Copacabana, Ipanema, Leblon, Botafogo, Apartamentos Rio, zonasulriodejaneiro',
  icons: {
    icon: 'https://zonasulriodejaneiro.com.br/favicon.ico',
    apple: 'https://zonasulriodejaneiro.com.br/apple-touch-icon.png',
    shortcut: 'https://zonasulriodejaneiro.com.br/favicon.ico',
  },
  openGraph: {
    title: 'Imóveis Zona Sul Rio de Janeiro | zonasulriodejaneiro',
    description: 'Catálogo de imóveis selecionados na Zona Sul do RJ.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark scroll-smooth">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-sky-500 selection:text-white">
        
        {/* Dynamic Navigation Bar */}
        <Header />

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
                <div>
                  <span className="font-black text-white text-base leading-none block">Imóveis</span>
                  <span className="text-[10px] text-sky-400 font-bold tracking-widest block">zonasulriodejaneiro</span>
                </div>
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
            © {new Date().getFullYear()} Imóveis Zona Sul Rio de Janeiro — Todos os direitos reservados.
          </div>
        </footer>

      </body>
    </html>
  );
}
