// Core TypeScript Definitions for UNLaR-Connect

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  avatarUrl?: string;
  rol: "alumno" | "tutor" | "admin";
}

export interface Documento {
  id: string;
  titulo: string;
  descripcion?: string;
  url: string;
  subidoPor: string;
  fechaCreacion: string;
  materiaId: string;
}

export interface MensajeChat {
  id: string;
  remitente: "user" | "assistant";
  contenido: string;
  fechaCreacion: string;
}
