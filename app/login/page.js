'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  LogIn, 
  Mail, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setFeedback(null);

    if (!email || !password) {
      setFeedback({ type: 'error', message: 'Preencha o e-mail e a senha.' });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setFeedback({ 
          type: 'error', 
          message: error.message.includes('Invalid login credentials') 
            ? 'E-mail ou senha incorretos. Verifique suas credenciais.' 
            : error.message 
        });
      } else {
        setFeedback({ type: 'success', message: 'Login realizado com sucesso! Redirecionando...' });
        setTimeout(() => {
          router.push(redirectTo);
          router.refresh();
        }, 1000);
      }
    } catch (err) {
      console.error('Erro ao efetuar login:', err);
      setFeedback({ type: 'error', message: 'Erro ao conectar com o servidor de autenticação.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
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

      <form onSubmit={handleLogin} className="space-y-5">
        
        {/* E-mail */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            E-mail Cadastrado
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              required
            />
          </div>
        </div>

        {/* Senha */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Senha de Acesso
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Entrando.....</span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Entrar no Painel</span>
            </>
          )}
        </button>

      </form>

      {/* Footer Signup Link */}
      <div className="mt-6 pt-6 border-t border-slate-800 text-center">
        <p className="text-xs text-slate-400">
          Ainda não tem cadastro como anunciante?{' '}
          <Link 
            href="/cadastro" 
            className="text-sky-400 hover:text-sky-300 font-bold underline underline-offset-4"
          >
            Cadastrar-se Agora
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header Back Link */}
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Catálogo
          </Link>

          {/* Logo & Title */}
          <div className="text-center">
            <div className="inline-flex w-14 h-14 rounded-2xl gradient-bg items-center justify-center shadow-xl shadow-sky-500/20 mb-4">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Área do Anunciante</h1>
            <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto">
              Entre com suas credenciais para gerenciar e publicar seus imóveis na Zona Sul do Rio de Janeiro
            </p>
          </div>
        </div>

        {/* Form Wrapped in Suspense Boundary */}
        <Suspense fallback={
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
            <p className="text-xs">Carregando formulário de login...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Acesso seguro com autenticação criptografada</span>
        </div>

      </div>
    </div>
  );
}
