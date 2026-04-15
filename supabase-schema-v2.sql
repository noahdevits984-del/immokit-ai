-- =============================================
-- ImmoKit AI — Migration v2
-- Exécuter APRÈS supabase-schema.sql
-- =============================================

-- ---- Ajouts sur la table profiles ----
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_discount BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Générer un code de parrainage unique pour les profils existants
UPDATE public.profiles
SET referral_code = UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- ---- Ajouts sur la table kits ----
ALTER TABLE public.kits
  ADD COLUMN IF NOT EXISTS has_photos BOOLEAN DEFAULT FALSE;

-- ---- Table: referrals ----
CREATE TABLE IF NOT EXISTS public.referrals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referred_email TEXT,
  status         TEXT NOT NULL DEFAULT 'pending', -- pending, rewarded
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- ---- Index ----
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS profiles_referral_code_idx ON public.profiles(referral_code);

-- ---- Bucket Supabase Storage pour les photos ----
-- À exécuter dans le Storage Dashboard :
-- 1. Créez un bucket "property-photos" (Public: ON)
-- 2. Ajoutez ces policies dans Storage > Policies :

-- Policy INSERT (upload) :
-- Nom : "Authenticated users can upload photos"
-- Allowed operation : INSERT
-- Target roles : authenticated
-- Policy definition : (bucket_id = 'property-photos')

-- Policy SELECT (read) :
-- Nom : "Public read access"
-- Allowed operation : SELECT
-- Target roles : public
-- Policy definition : (bucket_id = 'property-photos')

-- ---- Trigger mis à jour : inclure referral_code à la création ----
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
BEGIN
  ref_code := UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8));

  INSERT INTO public.profiles (id, email, full_name, agency, credits, plan, kits_generated, referral_code, created_at)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'agency', ''),
    3, 'free', 0, ref_code, NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Si parrainage, enregistrer la relation
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id, referred_email, status)
    SELECT id, NEW.id, NEW.email, 'pending'
    FROM public.profiles
    WHERE referral_code = NEW.raw_user_meta_data->>'referral_code'
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
