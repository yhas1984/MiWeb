-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users are viewable by admins" ON public.users
  FOR SELECT USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'admin');

CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.jwt() ? 'email' AND auth.jwt()->>'email' = email);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.jwt() ? 'email' AND auth.jwt()->>'email' = email);

-- Create RLS policies for verification_codes table
CREATE POLICY "Verification codes are viewable by admins" ON public.verification_codes
  FOR SELECT USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'admin');

CREATE POLICY "Users can view their own verification codes" ON public.verification_codes
  FOR SELECT USING (auth.jwt() ? 'email' AND auth.jwt()->>'email' = email);

CREATE POLICY "Users can update their own verification codes" ON public.verification_codes
  FOR UPDATE USING (auth.jwt() ? 'email' AND auth.jwt()->>'email' = email);

CREATE POLICY "Users can delete their own verification codes" ON public.verification_codes
  FOR DELETE USING (auth.jwt() ? 'email' AND auth.jwt()->>'email' = email);

-- Create RLS policies for notifications table
CREATE POLICY "Notifications are viewable by admins" ON public.notifications
  FOR SELECT USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'admin');

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (
    email IS NULL OR 
    (auth.jwt() ? 'email' AND auth.jwt()->>'email' = email)
  );

CREATE POLICY "Admins can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can update notifications" ON public.notifications
  FOR UPDATE USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'admin');

-- Fix OTP expiration time (reduce from 30 minutes to 10 minutes)
-- Update the verification service to use a shorter expiration time
