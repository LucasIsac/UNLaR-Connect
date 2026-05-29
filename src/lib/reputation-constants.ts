// Reputation constants - NOT a server action file

export const POINTS_PER_LEVEL = 250;

export const POINT_VALUES = {
  FORO_POST: 15,
  FORO_REPLY: 10,
  BEST_ANSWER_WINNER: 50,
  BEST_ANSWER_SELECTOR: 25,
  RESOURCE_UPVOTE: 5,
  RESOURCE_UPLOAD: 50,
  TUTORING_COMPLETE: 100,
  EVENT_REGISTRATION: 5,
} as const;

export const REASON_LABELS: Record<string, string> = {
  foro_post: "Publicó un hilo en el foro",
  foro_reply: "Respondió una pregunta",
  best_answer_winner: "Su respuesta fue seleccionada como mejor",
  best_answer_selector: "Seleccionó la mejor respuesta",
  resource_upvote: "Recibió un like en su recurso",
  resource_upload: "Subió un recurso al banco",
  tutoring_complete: "Completó una tutoría",
  event_registration: "Se inscribió en un evento",
};
