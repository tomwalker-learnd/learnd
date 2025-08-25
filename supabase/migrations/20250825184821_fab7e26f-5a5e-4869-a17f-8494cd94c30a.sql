-- Add UPDATE and DELETE policies for clients table
-- Only admin users should be able to modify client data

-- Policy for UPDATE operations - only admins can update client records
CREATE POLICY "Only admins can update clients" 
ON public.clients 
FOR UPDATE 
TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Policy for DELETE operations - only admins can delete client records  
CREATE POLICY "Only admins can delete clients"
ON public.clients
FOR DELETE 
TO authenticated
USING (public.get_current_user_role() = 'admin');