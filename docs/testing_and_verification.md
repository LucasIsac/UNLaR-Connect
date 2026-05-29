# UNLaR-Connect — Verification & Testing Guide

This guide provides developers and QA testers with practical instructions for manually verifying all core functionalities of UNLaR-Connect.

---

## 1. Real-Time WebRTC peer-to-peer Calls (Consultas Express)

This feature enables live 1-on-1 tutoring sessions with audio, video, chat, and contextual study material access.

### 🛠️ Prerequisites
1. **Two separate devices or browsers** (e.g. Chrome and Firefox, or a PC and a mobile phone).
2. **Two registered user accounts**:
   - **User A (The Tutor)**: Must have the Tutor role assigned (possessing certifications to teach).
   - **User B (The Student)**: Standard student account.
3. **Camera and microphone access** allowed in both environments.
4. **Network**: Standard Wi-Fi or cellular connections. *Avoid strict corporate/university firewalls that block direct P2P traffic if STUN/TURN fallbacks are bypassed.*

### 👣 Step-by-Step Test Walkthrough
1. **Tutor Online Setup**:
   - Log in as **User A (Tutor)**.
   - Navigate to `/tutorias`.
   - In the top-right availability widget, toggle **"Tu disponibilidad"** to **"Estoy disponible"** (turns green).
2. **Student Search**:
   - Log in as **User B (Student)** on the second device.
   - Navigate to `/tutorias`.
   - In the "Tutores Activos" list, verify that the card for **User A** appears with their subjects and karma stats.
3. **Initiating the Call**:
   - As the student (**User B**), click **"Pedir ayuda en vivo"** on the Tutor's card.
   - The student sees: *"Esperando que el tutor acepte la consulta..."*
   - Instantly, the Tutor (**User A**) receives a glowing animated modal banner with alert tones: **"¡Consulta entrante! [Student] necesita una mano en [Subject]"**.
4. **Accepting and Connecting**:
   - The Tutor clicks the green check icon (**Aceptar**).
   - Both devices are automatically redirected to the WebRTC room at `/tutorias/sala/[roomId]`.
5. **In-Session Interactions**:
   - **Audio/Video**: Confirm smooth streams showing the remote participant and a local thumbnail in the top-right.
   - **Controls**: Test muting mic, disabling camera, and toggling the side chat panel.
   - **Live Chat**: Send messages in the chat sidebar and confirm instant delivery.
   - **Resources**: Click the "Apuntes" tab in the panel and confirm study materials for that subject are downloadable inside the call.
6. **Disconnecting**:
   - Either user clicks the red phone button (**Colgar**).
   - Verify that both are redirected back to the `/tutorias` portal, and the tutoring log shows a new entry with the status **"Terminada"**.

### ⚠️ WebRTC Troubleshooting
*   **NAT Restriction Fallback**: If peer-to-peer fails to connect within 15 seconds due to strict NAT parameters, the application displays a warning: *"No pudimos conectar el video en esta red. Podés seguir por chat o reintentar."*
*   **Solution**: Switch one device to cellular data (4G/5G). Mobile networks rarely block WebRTC signalling or STUN negotiations.

---

## 2. RAG Document Ingestion & Chatbot Testing

Verifies chunk parsing, Google Gemini vector embeddings, and Groq LLM streaming responses.

### 👣 Test Walkthrough
1. **Uploading Material**:
   - Go to `/recursos` or `/chat` and click **"Subir Apunte"**.
   - Drag and drop a valid PDF, TXT, or MD file. Click upload.
   - Verify that the upload completes successfully and a new card appears in the list.
2. **Ingestion & Embedding generation**:
   - Open `/chat` and select your uploaded document.
   - Click **"Analizar Apunte"** or wait for the system to process.
   - Watch the server logs or ingestion spinner. The ingestion Server Action will parse the text, slice it into semantic 700-character chunks with a 150-character overlap, generate 768-dimension embeddings, and bulk save them to PostgreSQL.
   - Once completed, the interface displays: *“¡Buenísimo! Se procesaron X fragmentos...”*
3. **Semantic Chatbot Querying**:
   - Type a question about specific contents inside the document.
   - Click send.
   - Confirm that the returned answer uses natural **Argentine Spanish with voseo** (*"te comento"*, *"mirá"*, *"tenés"*).
   - Confirm that the answers are derived accurately from the document's content.
4. **Unmatched Query Fallback**:
   - Type a question completely unrelated to the document (e.g. asking for a pizza recipe inside a math document).
   - Verify that the assistant answers: *"Che, no encontré nada específico sobre eso en este apunte. ¿Querés que busquemos en internet o en otro documento?"*

---

## 3. Reputation & Karma Gamification

Checks transactional point calculations across various modules.

### 👣 Test Walkthrough
1. **Document Upload Reward**:
   - Note down your current reputation score.
   - Upload a new document under `/recursos`.
   - Verify that your score increases instantly by **+10 points**.
2. **Forum Vote Reward**:
   - Have a peer user upvote a forum thread or document you posted.
   - Verify that your karma ledger logs **+2 points** and your profile updates accordingly.
   - Have them downvote or withdraw the upvote.
   - Verify that your points are adjusted dynamically.
3. **Badges and Achievements**:
   - Earn points until passing a threshold (e.g., 75 points).
   - Navigate to `/perfil` or `/karma`.
   - Confirm that the matching badge (e.g., *Participante Activo*) is displayed on your achievements wall.

---

## 4. Mobile Layout & Responsive UI

Ensures layout adaptability on standard viewports.

### 👣 Test Walkthrough
1. **Responsive Navigation**:
   - In your browser's Developer Tools, toggle Device Toolbar and select a mobile size (e.g., iPhone 12/Pro).
   - Verify that the vertical Sidebar collapses completely.
   - Verify that the horizontal Bottom Navigation Bar appears with clear icons.
2. **Tappable Area Assessment**:
   - Ensure all mobile buttons, forms, and cards are easy to tap with a touch pointer (minimum size `44px` height).
