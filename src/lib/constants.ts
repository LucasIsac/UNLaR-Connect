/**
 * Global application configuration and constants.
 * Centralizing all external URLs and internal routes to avoid hardcoding.
 */

export const CONFIG = {
  githubRepo: "https://github.com/LucasIsac/UNLaR-Connect",
  socials: {
    github: "https://github.com/LucasIsac/UNLaR-Connect",
    twitter: "https://twitter.com/unlarconnect",
    instagram: "https://instagram.com/unlarconnect",
  },
  routes: {
    // Core Platform Routes
    home: "/",
    dashboard: "/dashboard",
    
    // Features / Fictitious Endpoints
    apuntes: "/apuntes",
    foros: "/foros",
    chat: "/chat",
    tutorias: "/tutorias",
    karma: "/karma",
    
    // Careers / Communities
    sistemas: "/carreras/sistemas",
    licSistemas: "/carreras/lic-sistemas",
    ranking: "/ranking",
    materias: "/materias",
    
    // Legal & Support
    terminos: "/legal/terminos",
    privacidad: "/legal/privacidad",
    soporte: "/soporte",
  }
} as const;
