# UNLaR-Connect — Database Schema & Security

UNLaR-Connect relies on **Supabase (PostgreSQL)** for transactional consistency, real-time sync, file storage, and vector searching. Row-Level Security (RLS) is strictly enforced to protect student profiles, tutoring channels, and forum interactions.

---

## 1. Database Entity Relationship & Table Glossary

The database is built around seven functional areas: Users & Identity, Academic Structure, Apuntes & Vector Store, Forum Discussions, Peer Tutoring & Live Calls, Real-Time Notifications, and Gamification.

### A. Users & Identity
*   `public.users`: Holds synchronized metadata from `auth.users`, including full name, role (`student` or `tutor`), profile avatar, accumulated `points` (karma), and references to their academic field (`career_id`).
*   `public.profiles`: Stores detailed biography, schedule availabilities, and localized preference metadata.

### B. Academic Structure
*   `public.careers`: Reference list of official university careers (e.g. *Licenciatura en Sistemas*, *Ingeniería en Informática*).
*   `public.subjects`: Reference list of subjects tied to academic degrees (e.g. *Análisis Matemático I*, *Algoritmos y Estructura de Datos*).
*   `public.topics`: Core themes or subject divisions used to catalog resources and forum threads semantically.

### C. Apuntes & Vector Store (RAG)
*   `public.documents`: Stores academic uploads (PDF, txt, md) containing a custom file title, `storage_url`, `document_type`, total `upvotes` counter, and references to `subject_id` / `topic_id`.
*   `public.document_embeddings`: Houses segmented paragraphs (`content`) and their matching 768-dimension vectors (`embedding` formatted with `pgvector`).
*   `public.saved_documents`: Tracks student bookmarks/favorites (joined on `user_id` and `document_id`).
*   `public.document_votes`: Tracks vote ledger (+1 upvote or -1 downvote per user/document pair).

### D. Academic Forum
*   `public.posts`: Thread headers containing titles, body text, attachment URLs (`image_url`), post type identifiers, and subject categorization.
*   `public.post_replies`: Discussion contributions linked to a thread with optional attachment images (`image_url`).
*   `public.post_votes`: Upvotes/downvotes logging on forum threads and replies to calculate karma dynamically.

### E. Peer-to-Peer Tutoring & Live calls (WebRTC)
*   `public.tutor_availability`: Active schedule indicators telling the platform if a tutor is active online.
*   `public.tutor_subjects`: Links certified tutors to the subjects they are capable of teaching.
*   `public.tutoring_sessions`: Scheduled bookings or peer-to-peer calendar logs.
*   `public.call_rooms`: Live call room indicators tracking WebRTC peer sessions (`requested`, `accepted`, `active`, `ended`, `rejected`, `missed`).
*   `public.call_messages`: Real-time text-message ledger synchronized during ongoing WebRTC calls.

### F. Real-Time Notifications
*   `public.notifications`: System-triggered alerts for events like incoming tutoring calls, new comments on followed forum threads, and badge achievements.

### G. Gamification Ledger
*   `public.karma_log`: An audit log detailing all reputation score additions and subtractions.
*   `public.badges`: Catalog of system achievements (e.g., *Participante Activo*, *Mentor Colaborativo*).
*   `public.user_badges`: Links acquired achievements to students based on points or total contributions.

---

## 2. PostgreSQL Triggers & Functions (Automation)

To keep the application highly responsive and avoid heavy Next.js database updates, transactional point calculations are delegated to PostgreSQL database triggers.

### A. Automatic Upload Points Trigger (`public.reward_upload_points`)
*   **Trigger Event**: `AFTER INSERT ON public.documents`
*   **Action**: Automatically adds `+10` points to the uploader's `public.users` ledger.

### B. Vote Interaction Trigger (`public.handle_document_vote`)
*   **Trigger Event**: `AFTER INSERT ON public.document_votes`
*   **Action**: Increments the `upvotes` counter on `public.documents` based on direction (+1/-1) and updates the document owner's karma profile by `+2` or `-2` respectively. An opposite trigger (`public.handle_document_unvote`) rolls back this modification upon deletion.

---

## 3. Row-Level Security (RLS) & Privacy Policies

All tables in the database have Row-Level Security enabled. A sample layout of policies:

### Profile Security
- **SELECT**: Any authenticated user can read public profile names and stats (enables peer-finding and tutoring).
- **UPDATE**: Limited strictly to `auth.uid() = id`, meaning students can only update their own profiles.

### Tutoring call Security
- **SELECT / UPDATE**: Limited to participants (`auth.uid() = student_id OR auth.uid() = tutor_id`).
- **INSERT**: Limited to students starting a request (`auth.uid() = student_id`).

### Vector Storage Protection
- **SELECT**: Authenticated users can query chunks via matching semantic searches.
- **INSERT**: Forbidden on database client level; embeddings are strictly handled by Server Actions executing with service permissions to maintain indexing integrity.

---

> [!IMPORTANT]
> When executing schema changes, always use Supabase Migrations under `supabase/migrations/` and re-generate TypeScript typings using the standard Supabase CLI commands: `npx supabase gen types typescript --project-id ... > src/types/database.ts`.
