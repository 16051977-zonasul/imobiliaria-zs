-- ==============================================================================
-- MIGRATION: Tabela Profiles Expandida, RLS e Buckets no Supabase
-- Executar no SQL Editor do Supabase Dashboard (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Criação da Tabela 'profiles' vinculada ao auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  telefone TEXT,
  cpf TEXT,
  documento_url TEXT,
  foto_url TEXT,
  redes_sociais TEXT,
  tipo_anunciante TEXT DEFAULT 'Sou Corretor(a)',
  creci TEXT,
  bio TEXT,
  status_verificacao TEXT NOT NULL DEFAULT 'pendente' CHECK (status_verificacao IN ('pendente', 'aprovado', 'rejeitado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adiciona novas colunas caso a tabela já existisse anteriormente
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS redes_sociais TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tipo_anunciante TEXT DEFAULT 'Sou Corretor(a)';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS creci TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Habilita a Segurança a Nível de Linha (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (RLS) para 'profiles'
DROP POLICY IF EXISTS "Qualquer pessoa pode ver os perfis dos anunciantes" ON public.profiles;
CREATE POLICY "Qualquer pessoa pode ver os perfis dos anunciantes" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Usuários podem inserir o próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem inserir o próprio perfil" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar o próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar o próprio perfil" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- 4. Função e Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Bucket Privado de Documentos no Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Bucket Público de Avatares no Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatares', 'avatares', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies para Avatares
DROP POLICY IF EXISTS "Qualquer pessoa pode ver avatares" ON storage.objects;
CREATE POLICY "Qualquer pessoa pode ver avatares"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatares');

DROP POLICY IF EXISTS "Usuários autenticados podem enviar avatares" ON storage.objects;
CREATE POLICY "Usuários autenticados podem enviar avatares"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatares' AND auth.role() = 'authenticated');
