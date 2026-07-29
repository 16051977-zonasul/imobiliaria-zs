'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Building2, PlusCircle, Compass, LogIn, UserPlus, UserCheck, User, LogOut } from 'lucide-react';

export default function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white leading-none">
              Imóveis
            </span>
            <span className="block text-[10px] tracking-widest text-sky-400 font-bold mt-0.5">
              zonasulriodejaneiro
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-3">
          <Link 
            href="/" 
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-sky-400 transition-colors px-3 py-2"
          >
            <Compass className="w-4 h-4" />
            Catálogo
          </Link>

          {!user ? (
            <>
              <Link 
                href="/login" 
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3.5 py-2.5 rounded-xl border border-slate-700/60 transition-all"
              >
                <LogIn className="w-4 h-4 text-sky-400" />
                <span>Entrar</span>
              </Link>

              <Link 
                href="/cadastro" 
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3.5 py-2.5 rounded-xl border border-slate-700/60 transition-all"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Cadastrar</span>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                href="/perfil" 
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3 py-2 rounded-xl border border-slate-700/60 transition-all"
              >
                <User className="w-4 h-4 text-sky-400" />
                <span>Meu Perfil</span>
              </Link>

              <Link 
                href="/admin" 
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3 py-2 rounded-xl border border-slate-700/60 transition-all"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Painel</span>
              </Link>

              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/';
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 flex items-center gap-1 cursor-pointer"
                title="Sair da Conta"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <Link 
            href="/admin" 
            className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Anunciar Imóvel</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
