// Configuración para Vercel Analytics
export const analyticsConfig = {
  debug: false,
  mode: "auto",
  excludePaths: ["/admin/*", "/api/*"],
  // Eliminamos la función beforeSend que está causando el problema
}
