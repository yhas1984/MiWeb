-- Ajustar la configuración de expiración de OTP en Supabase Auth
UPDATE auth.config
SET 
  -- Reducir el tiempo de expiración de OTP a 15 minutos (900 segundos)
  otp_ttl = 900,
  -- Asegurarse de que la protección contra contraseñas filtradas esté habilitada
  enable_weak_password_check = true;

-- También debemos actualizar nuestro código en verification-service-supabase.ts
-- para que coincida con esta configuración
