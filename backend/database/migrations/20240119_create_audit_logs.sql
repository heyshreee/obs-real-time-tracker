-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own logs
CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy to allow the service role (backend) to insert logs
-- Note: In Supabase, the backend usually uses the service_role key which bypasses RLS,
-- but it's good practice to have policies if needed.
CREATE POLICY "Service role can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);
