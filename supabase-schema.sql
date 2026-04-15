-- =============================================
-- ImmoKit AI — Supabase Schema
-- À exécuter dans l'éditeur SQL de Supabase
-- =============================================

-- ---- Table: profiles ----
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  full_name     TEXT,
  agency        TEXT,
  credits       INTEGER NOT NULL DEFAULT 3,
  plan          TEXT NOT NULL DEFAULT 'free',
  kits_generated INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Table: kits ----
CREATE TABLE IF NOT EXISTS public.kits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_type TEXT,
  city          TEXT,
  price         TEXT,
  surface       TEXT,
  tone          TEXT,
  language      TEXT,
  contents      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Row Level Security ----

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Kits policies
CREATE POLICY "Users can view own kits"
  ON public.kits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kits"
  ON public.kits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own kits"
  ON public.kits FOR DELETE
  USING (auth.uid() = user_id);

-- ---- Function: increment_kits ----
CREATE OR REPLACE FUNCTION public.increment_kits(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET kits_generated = kits_generated + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---- Trigger: auto-create profile on signup ----
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, agency, credits, plan, kits_generated, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'agency', ''),
    3,
    'free',
    0,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---- Indexes for performance ----
CREATE INDEX IF NOT EXISTS kits_user_id_idx ON public.kits(user_id);
CREATE INDEX IF NOT EXISTS kits_created_at_idx ON public.kits(created_at DESC);
