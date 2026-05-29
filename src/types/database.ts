// TypeScript typings reflecting the Supabase database schema for UNLaR-Connect

export interface DbRole {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface DbCareer {
  id: number;
  name: string;
  plan_study: string;
  description?: string;
}

export interface DbUser {
  id: string; // UUID from auth.users
  role_id: number;
  career_id?: number;
  name: string;
  last_name: string;
  email: string;
  is_unlar_member: boolean;
  points: number; // For gamification rankings
  tutor_rating: number;
  total_reviews: number;
  created_at: string;
  deleted_at?: string;
  avatar_url?: string;
  tutor_price?: number;
  contact_visibility?: boolean;
}

export interface DbSubject {
  id: number;
  name: string;
  year: number;
}

export interface DbCareerSubject {
  career_id: number;
  subject_id: number;
}

export interface DbTopic {
  id: number;
  subject_id: number;
  name: string;
  description?: string;
}

export interface DbDocument {
  id: string; // UUID
  user_id: string; // UUID
  subject_id?: number;
  topic_id?: number;
  title: string;
  document_type: string;
  storage_url: string;
  uploaded_at: string;
  upvotes: number;
}

export interface DbDocumentEmbedding {
  id: string; // UUID
  document_id: string; // UUID
  content: string;
  embedding: number[]; // pgvector representation
}

export interface DbTutorSubject {
  id: number;
  tutor_id: string; // UUID
  subject_id: number;
  created_at: string;
}

export interface DbTutorAvailability {
  id: number;
  tutor_id: string; // UUID
  day_of_week: number; // 0 to 6
  start_time: string; // TIME format
  end_time: string; // TIME format
}

export interface DbTutoringSession {
  id: string; // UUID
  tutor_id?: string; // UUID
  student_id?: string; // UUID
  subject_id?: number;
  scheduled_start: string;
  scheduled_end: string;
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  meeting_link?: string;
  created_at: string;
}

export interface DbReview {
  id: string; // UUID
  session_id?: string; // UUID
  reviewer_id?: string; // UUID
  tutor_id: string; // UUID
  rating: number; // 1 to 5
  comment?: string;
  created_at: string;
}

export interface DbPostType {
  id: number;
  name: string; // 'duda_academica' | 'consejo' | 'compraventa' | etc.
  description?: string;
}

export interface DbTag {
  id: number;
  name: string;
}

export type QuestionMetadata = Record<string, never>;

export type ResourceMetadata = Record<string, never>;

export interface TutoringMetadata {
  subject: string;
  price_type: 'free' | 'paid';
  price?: number;
  modality: 'online' | 'present' | 'hybrid';
  availability: string;
}

export interface BorrowMetadata {
  item_name: string;
  condition: 'new' | 'used_good' | 'used_fair';
  availability: string;
  location: string;
  image_url?: string;
  status: 'available' | 'reserved' | 'delivered' | 'returned';
}

export interface SellRentMetadata {
  item_name: string;
  price: number;
  condition: 'new' | 'used_good' | 'used_fair';
  mode: 'sell' | 'rent';
  location: string;
  image_url?: string;
}

export type PostMetadata = QuestionMetadata | ResourceMetadata | TutoringMetadata | BorrowMetadata | SellRentMetadata;

export interface DbPost {
  id: string; // UUID
  user_id: string; // UUID
  subject_id?: number;
  post_type_id: number;
  title: string;
  content: string;
  upvotes: number;
  is_resolved: boolean;
  created_at: string;
  type: 'question' | 'resource' | 'tutoring' | 'borrow' | 'sell_rent';
  metadata: any; // Using any for flexible type casting in JSON fields
  image_url?: string;
}

export interface DbPostTag {
  post_id: string; // UUID
  tag_id: number;
}

export interface DbPostReply {
  id: string; // UUID
  post_id: string; // UUID
  user_id: string; // UUID
  content: string;
  upvotes: number;
  is_accepted: boolean;
  created_at: string;
  image_url?: string;
}

export interface DbBadge {
  id: number;
  name: string;
  description: string;
  icon_name?: string;
  required_points: number;
  created_at: string;
}

export interface DbUserBadge {
  user_id: string; // UUID
  badge_id: number;
  awarded_at: string;
}

export interface DbChatSession {
  id: string; // UUID
  user_id: string; // UUID
  document_id?: string; // UUID
  subject_id?: number;
  title: string;
  created_at: string;
}

export interface DbChatMessage {
  id: string; // UUID
  session_id: string; // UUID
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface DbNotification {
  id: string; // UUID
  user_id: string; // UUID
  title: string;
  content: string;
  type: 'tutorias' | 'karma' | 'foros' | 'sistema';
  is_read: boolean;
  created_at: string;
}

// ============================================================
// Consultas Express — live 1-on-1 tutoring calls
// ============================================================

export type CallRoomStatus = 'requested' | 'accepted' | 'active' | 'ended' | 'rejected' | 'missed';

export interface DbCallRoom {
  id: string; // UUID
  subject_id: number | null;
  student_id: string; // UUID
  tutor_id: string; // UUID
  status: CallRoomStatus;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface DbCallMessage {
  id: string; // UUID
  room_id: string; // UUID
  sender_id: string; // UUID
  content: string;
  created_at: string;
}

// ==========================================
// Events System
// ==========================================

export interface DbEvent {
  id: string; // UUID
  title: string;
  description: string;
  event_type: 'seminario' | 'capacitacion' | 'diplomatura' | 'taller' | 'conferencia' | 'otro';
  start_date: string; // TIMESTAMPTZ
  end_date: string;
  registration_deadline: string;
  location: string;
  meeting_link?: string;
  image_url?: string;
  created_by: string; // UUID
  max_participants?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
}

export interface DbEventRegistration {
  id: string; // UUID
  event_id: string; // UUID
  user_id: string; // UUID
  registered_at: string;
}
