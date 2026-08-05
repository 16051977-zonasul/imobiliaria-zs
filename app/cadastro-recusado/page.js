'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { XCircle, AlertTriangle, UserPlus, LogOut } from 'lucide-react';

export default function CadastroRecusadoPage() {
  const router = useRouter();

  async function handleRefazerCadastro() {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Erro ao fazer signOut:', err);
    }
    router.push('/cadastro');
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full mx-auto">
        <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          {/* Ícone de Alerta */}
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <XCircle className="w-8 h-8" />
          </div>

          {/* Cabeçalho */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">Cadastro Recusado</h1>
            <p className="text-rose-400 text-xs sm:text-sm font-bold uppercase tracking-wider">
              Divergência ou Falha na Verificação do Documento
            </p>
          </div>

          {/* Card do Motivo */}
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-5 text-left space-y-2">
            <p className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              Motivo da Recusa:
            </p>
            <p className="text-xs sm:text-sm text-rose-100 leading-relaxed">
              Os dados contidos na imagem do documento enviada não conferem com as informações digitadas no formulário (Nome, CPF, Data de Nascimento ou Filiação).
            </p>
          </div>

          {/* Orientação + Botão Refazer Cadastro */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-left space-y-4">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Como os dados não conferem, o cadastro anterior foi cancelado e os dados anteriores foram removidos por segurança. Por favor, faça um novo cadastro com as informações e documentos corretos.
            </p>
            
            <button
              onClick={handleRefazerCadastro}
              className="w-full bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Refazer Cadastro</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
