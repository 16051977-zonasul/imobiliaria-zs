-- ==============================================================================
-- MIGRATION: Tabela Profiles, Imóveis, Foreign Keys (ON DELETE CASCADE) e Buckets
-- Executar no SQL Editor do Supabase Dashboard (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Criação da Tabela 'profiles' vinculada ao auth.users com ON DELETE CASCADE
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
  data_nascimento TEXT,
  filiacao TEXT,
  motivo_recusa TEXT,
  status_verificacao TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adiciona novas colunas caso a tabela já existisse anteriormente
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS redes_sociais TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tipo_anunciante TEXT DEFAULT 'Sou Corretor(a)';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS creci TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_nascimento TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS filiacao TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS motivo_recusa TEXT;

-- 2. Habilita a Segurança a Nível de Linha (RLS) para profiles
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

DROP POLICY IF EXISTS "Usuários podem deletar o próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem deletar o próprio perfil" 
  ON public.profiles 
  FOR DELETE 
  USING (auth.uid() = id);

-- 4. Tabela 'imoveis' e Foreign Key vinculada ao usuário com ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS public.imoveis (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT,
  transacao TEXT,
  preco NUMERIC,
  preco_mensal_temporada NUMERIC,
  condominio NUMERIC,
  iptu NUMERIC,
  bairro TEXT,
  quartos INTEGER,
  banheiros INTEGER,
  vagas INTEGER,
  area_m2 NUMERIC,
  fotos TEXT[],
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garante que a FK de usuario_id tenha ON DELETE CASCADE caso a tabela já existia
ALTER TABLE public.imoveis DROP CONSTRAINT IF EXISTS imoveis_usuario_id_fkey;
ALTER TABLE public.imoveis ADD CONSTRAINT imoveis_usuario_id_fkey 
  FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Função e Trigger para atualizar updated_at automaticamente em profiles
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

-- 6. Bucket Privado de Documentos no Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

-- 7. Bucket Público de Avatares no Supabase Storage
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
