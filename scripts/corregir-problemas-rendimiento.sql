-- 1. Corregir "Multiple Permissive Policies" en public.user_profiles
-- Primero, vamos a eliminar las políticas duplicadas y crear una única política eficiente

-- Eliminar todas las políticas existentes en user_profiles
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN (
        SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' AND schemaname = 'public'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', policy_name);
    END LOOP;
END $$;

-- Crear una única política eficiente
CREATE POLICY "Los usuarios pueden ver sus propios perfiles" ON public.user_profiles
FOR SELECT
USING (user_id = auth.uid());

-- 2. Corregir "Auth RLS Initialization Plan" para las tablas mencionadas
-- Actualizar la política para user_profiles para usar auth.uid() directamente
ALTER POLICY "Los usuarios pueden ver sus propios perfiles" ON public.user_profiles
USING (user_id = auth.uid());

-- Crear políticas eficientes para site_settings si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'site_settings' AND schemaname = 'public') THEN
        -- Asumiendo que site_settings debe ser accesible solo por administradores
        CREATE POLICY "Solo administradores pueden ver configuraciones" ON public.site_settings
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid() AND is_admin = true
            )
        );
    END IF;
END $$;

-- Crear políticas eficientes para news si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'news' AND schemaname = 'public') THEN
        -- Asumiendo que news debe ser accesible por todos
        CREATE POLICY "Todos pueden ver noticias" ON public.news
        FOR SELECT
        USING (true);
        
        -- Solo administradores pueden modificar noticias
        CREATE POLICY "Solo administradores pueden modificar noticias" ON public.news
        FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid() AND is_admin = true
            )
        );
    END IF;
END $$;

-- 3. Corregir "Unindexed foreign keys" en public.exchange_rate_history
DO $$
BEGIN
    -- Verificar si la tabla existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exchange_rate_history') THEN
        -- Crear índice para la clave foránea (asumiendo que la columna se llama currency_id o similar)
        -- Ajusta el nombre de la columna según tu esquema real
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'exchange_rate_history' AND indexname = 'idx_exchange_rate_history_currency_id') THEN
            CREATE INDEX idx_exchange_rate_history_currency_id ON public.exchange_rate_history(currency_id);
        END IF;
    END IF;
END $$;

-- 4. Evaluar y posiblemente eliminar índices no utilizados
-- NOTA: Antes de eliminar índices, es recomendable verificar si realmente no son necesarios
-- Aquí solo mostramos cómo identificarlos, pero no los eliminamos automáticamente

-- Para public.user_profiles
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- Para public.notifications
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'notifications' AND schemaname = 'public';

-- Comentario: Si después de revisar decides eliminar algún índice, puedes usar:
-- DROP INDEX IF EXISTS public.nombre_del_indice;
