-- Create referral_codes table
CREATE TABLE public.referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    uses_remaining INTEGER DEFAULT 1,
    used_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view referral codes" ON public.referral_codes FOR SELECT USING (true);
CREATE POLICY "Users can create own referral codes" ON public.referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own codes or when redeeming" ON public.referral_codes FOR UPDATE USING (true);

-- Create referral_rewards table to track who gave and received rewards
CREATE TABLE public.referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    referrer_months_awarded INTEGER DEFAULT 3,
    referred_months_awarded INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(referred_id)
);

-- Enable RLS
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own referral rewards" ON public.referral_rewards FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "System can create referral rewards" ON public.referral_rewards FOR INSERT WITH CHECK (true);

-- Function to generate referral code from combat_name + 3 random digits
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_combat_name TEXT;
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Get user's combat name
  SELECT combat_name INTO v_combat_name FROM users WHERE id = p_user_id;
  
  IF v_combat_name IS NULL THEN
    RAISE EXCEPTION 'User must have a combat name to generate referral code';
  END IF;
  
  -- Generate unique code
  LOOP
    v_code := v_combat_name || LPAD(FLOOR(random() * 1000)::text, 3, '0');
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;