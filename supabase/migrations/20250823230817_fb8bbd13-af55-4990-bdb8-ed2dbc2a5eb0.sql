-- Create security definer function to get current user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create security definer function to check if user can update role
CREATE OR REPLACE FUNCTION public.can_update_role(target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) OR target_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop existing profile update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new secure profile update policy that prevents regular users from changing roles
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND (
    -- Only admins can change roles, or user is updating their own non-role fields
    public.get_current_user_role() = 'admin' 
    OR (
      -- Regular users can't change their role
      role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    )
  )
);