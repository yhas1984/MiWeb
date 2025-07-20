-- 1. Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas RLS para la tabla users
CREATE POLICY "Users are viewable by admins" ON public.users
  FOR SELECT USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'admin');

CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.jwt() ? 'email' AND auth.jwt()->>'email' = email);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.jwt() ? 'email' AND auth.jwt()->>'email' = email);

-- 3. Crear políticas RLS para la tabla verification_codes
CREATE POLICY "Verification codes are viewable by admins" ON public.verification_codes
  FOR SELECT USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'admin');

CREATE POLICY "Users can view their own verification codes" ON public.verification_codes
  FOR SELECT USING (auth.jwt() ? 'email' AND auth.jwt()->>'email' = email);

CREATE POLICY "Users can update their own verification codes" ON public.verification_codes
  FOR UPDATE USING (auth.jwt() ? 'email' AND auth.jwt()->>'email' = email);

CREATE POLICY "Users can delete their own verification codes" ON public.verification_codes
  FOR DELETE USING (auth.jwt() ? 'email' AND auth.jwt()->>'email' = email);

-- 4. Crear políticas RLS para la tabla notifications
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

-- 5. Corregir el problema "Function Search Path Mutable"
-- Esto ocurre cuando las funciones pueden cambiar el search_path
-- Solución: Establecer search_path explícitamente en las funciones

-- Ejemplo para public.update_* (ajustar según las funciones específicas)
CREATE OR REPLACE FUNCTION public.update_verification_status(p_email TEXT, p_status BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
  -- Establecer search_path explícitamente
  SET LOCAL search_path TO public, pg_catalog;
  
  -- Resto de la función...
  UPDATE public.users SET verified = p_status WHERE email = p_email;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejemplo para public.is_admin_* (ajustar según las funciones específicas)
CREATE OR REPLACE FUNCTION public.is_admin_check(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Establecer search_path explícitamente
  SET LOCAL search_path TO public, pg_catalog;
  
  -- Resto de la función...
  RETURN EXISTS (SELECT 1 FROM public.users WHERE email = p_email AND is_admin = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Configurar Auth para protección contra contraseñas filtradas
-- Esto se hace en la configuración de Auth en Supabase
-- SQL para habilitar la protección:
UPDATE auth.config
SET enable_weak_password_check = true;
