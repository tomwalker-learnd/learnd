-- Create subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'team', 'business', 'enterprise');

-- Add subscription_tier column to profiles table with default 'free'
ALTER TABLE public.profiles 
ADD COLUMN subscription_tier public.subscription_tier NOT NULL DEFAULT 'free';

-- Update the handle_new_user function to include subscription_tier
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, last_name, subscription_tier)
  VALUES (
    NEW.id,
    NEW.email,
    'basic_user',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'free'
  );
  RETURN NEW;
END;
$$;