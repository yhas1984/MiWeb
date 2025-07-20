-- 1. Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para la tabla users
CREATE POLICY select_own_user ON public.users
FOR SELECT USING (id = auth.uid());

CREATE POLICY update_own_user ON public.users
FOR UPDATE USING (id = auth.uid());

-- Política para administradores (asumiendo que hay una columna is_admin)
CREATE POLICY admin_manage_users ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 3. Políticas para la tabla verification_codes
CREATE POLICY select_own_verification ON public.verification_codes
FOR SELECT USING (
  email = (SELECT email FROM public.users WHERE id = auth.uid())
);

CREATE POLICY update_own_verification ON public.verification_codes
FOR UPDATE USING (
  email = (SELECT email FROM public.users WHERE id = auth.uid())
);

CREATE POLICY delete_own_verification ON public.verification_codes
FOR DELETE USING (
  email = (SELECT email FROM public.users WHERE id = auth.uid())
);

-- 4. Políticas para la tabla notifications
CREATE POLICY select_own_notification ON public.notifications
FOR SELECT USING (
  email IS NULL OR 
  email = (SELECT email FROM public.users WHERE id = auth.uid())
);

CREATE POLICY admin_manage_notifications ON public.notifications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 5. Corregir el problema "Function Search Path Mutable"
-- Para funciones update_*
DO $$ 
DECLARE
  func_name text;
BEGIN
  FOR func_name IN 
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name LIKE 'update_%'
  LOOP
    EXECUTE format('
      ALTER FUNCTION public.%I SECURITY DEFINER
      SET search_path = public, pg_catalog;
    ', func_name);
  END LOOP;
END $$;

-- Para funciones is_admin_*
DO $$ 
DECLARE
  func_name text;
BEGIN
  FOR func_name IN 
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name LIKE 'is_admin_%'
  LOOP
    EXECUTE format('
      ALTER FUNCTION public.%I SECURITY DEFINER
      SET search_path = public, pg_catalog;
    ', func_name);
  END LOOP;
END $$;

-- 6. Configurar Auth para protección contra contraseñas filtradas
UPDATE auth.config
SET enable_weak_password_check = true;

-- 7. Corregir "Auth OTP Long Expiry"
-- Reducir el tiempo de expiración de los códigos OTP a un valor más seguro (1 hora)
UPDATE auth.config
SET code_expiry_seconds = 3600
WHERE code_expiry_seconds > 3600;
