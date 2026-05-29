"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createClient as createBrowserClient,
  unsubscribeRealtimeChannel,
} from "@/lib/supabase/client";
import { useCallPresence } from "@/hooks/useCallPresence";
import { 
  AvailableTutor, 
  fetchAvailableTutors, 
  requestCall, 
  respondToCall,
  fetchCallHistory,
  CallRoomExtended
} from "@/actions/consultas";
import TutorCard from "@/components/consultas/TutorCard";
import IncomingCallBanner from "@/components/consultas/IncomingCallBanner";
import { 
  Video, 
  ToggleLeft, 
  ToggleRight, 
  Users, 
  Calendar, 
  Search, 
  Clock, 
  Award,
  BookOpen, 
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { DbSubject } from "@/types/database";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type { CombinedHeaderData } from "@/actions/perfil";

interface TutoriasClientProps {
  currentUser: {
    id: string;
    name: string;
    last_name: string;
    role_id: number; // 3 = Tutor, 2 = Student
    avatar_url?: string;
  };
  initialHeaderData?: CombinedHeaderData;
}

export default function TutoriasClient({ currentUser, initialHeaderData }: TutoriasClientProps) {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [subjects, setSubjects] = useState<DbSubject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Realtime Presence for tutors
  const { onlineTutors, isAvailable, toggleAvailability } = useCallPresence(
    currentUser.id,
    {
      name: currentUser.name,
      last_name: currentUser.last_name,
      avatar_url: currentUser.avatar_url,
      role_id: currentUser.role_id,
    }
  );

  // Available tutors from the database matching current filters
  const [allTutors, setAllTutors] = useState<AvailableTutor[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(true);

  // Incoming and outgoing call management
  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const [activeCallRoomId, setActiveCallRoomId] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [pendingCallMessage, setPendingCallMessage] = useState<string | null>(null);

  // Call history & analytics
  const [history, setHistory] = useState<CallRoomExtended[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Fetch initial data
  useEffect(() => {
    async function loadInitialData() {
      try {
        // 1. Fetch subjects
        const { data: subs } = await supabase.from("subjects").select("*").order("name");
        setSubjects(subs || []);

        // 2. Fetch all tutors from database to match with presence
        const tutorsRes = await fetchAvailableTutors();
        if (tutorsRes.success && tutorsRes.data) {
          setAllTutors(tutorsRes.data);
        }

        // 3. Fetch user call history
        const historyRes = await fetchCallHistory();
        if (historyRes.success && historyRes.data) {
          setHistory(historyRes.data);
        }
      } catch (err) {
        console.error("Error loading tutorias initial data:", err);
      } finally {
        setLoadingTutors(false);
        setLoadingHistory(false);
      }
    }

    loadInitialData();
  }, []);

  // Listen for incoming call requests (if user is a tutor)
  useEffect(() => {
    if (currentUser.role_id !== 3) return;

    const channel = supabase
      .channel("tutor_call_listeners")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_rooms",
          filter: `tutor_id=eq.${currentUser.id}`,
        },
        async (payload: any) => {
          const newRoom = payload.new;
          if (newRoom.status === "requested") {
            // Load student profile & subject details for the incoming banner
            const { data: student } = await supabase
              .from("users")
              .select("name, last_name")
              .eq("id", newRoom.student_id)
              .single();

            let subjectName = "Consulta General";
            if (newRoom.subject_id) {
              const { data: subject } = await supabase
                .from("subjects")
                .select("name")
                .eq("id", newRoom.subject_id)
                .single();
              if (subject) {
                subjectName = subject.name;
              }
            }

            setIncomingCall({
              roomId: newRoom.id,
              studentName: student ? `${student.name} ${student.last_name}` : "Estudiante",
              subjectName,
            });
          }
        }
      )
      .subscribe();

    return () => {
      unsubscribeRealtimeChannel(channel);
    };
  }, [currentUser.id, currentUser.role_id]);

  // Listen for outgoing request status changes (if student is waiting)
  useEffect(() => {
    if (!activeCallRoomId) return;

    const channel = supabase
      .channel(`active_call_room_listener_${activeCallRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "call_rooms",
          filter: `id=eq.${activeCallRoomId}`,
        },
        (payload: any) => {
          const updatedRoom = payload.new;
          if (updatedRoom.status === "accepted" || updatedRoom.status === "active") {
            // Redirect both parties to live room
            router.push(`/tutorias/sala/${activeCallRoomId}`);
          } else if (updatedRoom.status === "rejected") {
            alert("El tutor rechazó la consulta en este momento.");
            setIsRequesting(false);
            setActiveCallRoomId(null);
            setPendingCallMessage(null);
          }
        }
      )
      .subscribe();

    return () => {
      unsubscribeRealtimeChannel(channel);
    };
  }, [activeCallRoomId]);

  // Student: request live consultation
  const handleRequestCall = async (tutorId: string, subjectId: number | null) => {
    setIsRequesting(true);
    setPendingCallMessage("Llamando al tutor...");
    
    const res = await requestCall(tutorId, subjectId);
    if (res.success && res.data) {
      setActiveCallRoomId(res.data.id);
      setPendingCallMessage("Esperando que el tutor acepte la consulta...");
    } else {
      alert(res.error || "No se pudo realizar el llamado.");
      setIsRequesting(false);
      setPendingCallMessage(null);
    }
  };

  // Tutor: accept incoming consultation
  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    setIsResponding(true);
    const res = await respondToCall(incomingCall.roomId, true);
    if (res.success && res.data) {
      router.push(`/tutorias/sala/${incomingCall.roomId}`);
    } else {
      alert(res.error || "Error al aceptar la consulta.");
      setIsResponding(false);
      setIncomingCall(null);
    }
  };

  // Tutor: reject incoming consultation
  const handleRejectCall = async () => {
    if (!incomingCall) return;
    setIsResponding(true);
    await respondToCall(incomingCall.roomId, false);
    setIsResponding(false);
    setIncomingCall(null);
  };

  // Intersect DB tutors list with current online presence to render available tutors
  const getAvailableTutors = (): AvailableTutor[] => {
    return allTutors.filter((tutor) => {
      // Exclude current user from the list of available tutors
      if (tutor.id === currentUser.id) return false;

      // Must be online based on presence
      const isOnline = onlineTutors[tutor.id]?.available;
      if (!isOnline) return false;

      // Filter by subject search
      if (selectedSubjectId) {
        const teachesSubject = tutor.subjects.some((s) => s.id === selectedSubjectId);
        if (!teachesSubject) return false;
      }

      // Filter by text search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = `${tutor.name} ${tutor.last_name}`.toLowerCase();
        const matchesName = fullName.includes(query);
        const matchesSubject = tutor.subjects.some((s) => s.name.toLowerCase().includes(query));
        if (!matchesName && !matchesSubject) return false;
      }

      return true;
    });
  };

  const filteredAvailableTutors = getAvailableTutors();

  // Pre-calculate analytics for impressive scalability dashboard
  const analytics = {
    totalCalls: history.length,
    totalMinutes: history.reduce((acc, curr) => {
      if (curr.started_at && curr.ended_at) {
        const diff = new Date(curr.ended_at).getTime() - new Date(curr.started_at).getTime();
        return acc + Math.floor(diff / 60000);
      }
      return acc;
    }, 0),
    topSubject: (() => {
      const counts: Record<string, number> = {};
      history.forEach((curr) => {
        if (curr.subject) {
          counts[curr.subject.name] = (counts[curr.subject.name] || 0) + 1;
        }
      });
      let top = "Ninguna";
      let max = 0;
      Object.entries(counts).forEach(([name, count]) => {
        if (count > max) {
          max = count;
          top = name;
        }
      });
      return top;
    })(),
  };

  return (
    <DashboardLayout initialHeaderData={initialHeaderData} showSearch={false}>
      <div className="space-y-8 animate-fade-in pb-12">
      {/* Incoming call notification */}
      {incomingCall && (
        <IncomingCallBanner
          studentName={incomingCall.studentName}
          subjectName={incomingCall.subjectName}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          isResponding={isResponding}
        />
      )}

      {/* Student waiting screen modal */}
      {isRequesting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-glass border border-accent/20 rounded-xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center text-accent mx-auto relative">
              <span className="absolute inset-0 rounded-full bg-accent/20 animate-ping opacity-75"></span>
              <Video className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading font-black text-xl text-foreground">
                Conectando...
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pendingCallMessage}
              </p>
            </div>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
            <button
              onClick={() => {
                if (activeCallRoomId) {
                  respondToCall(activeCallRoomId, false);
                }
                setIsRequesting(false);
                setActiveCallRoomId(null);
                setPendingCallMessage(null);
              }}
              className="w-full bg-muted text-foreground hover:bg-muted/80 font-semibold py-2.5 rounded-xl transition-all"
            >
              Cancelar llamada
            </button>
          </div>
        </div>
      )}

      {/* Header section with Tutor toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-glass p-6 rounded-xl border border-border/40 shadow-lg">
        <div>
          <h1 className="font-heading font-black text-3xl text-foreground flex items-center gap-3">
            <Video className="w-8 h-8 text-accent animate-pulse" />
            Consultas Express
          </h1>
          <p className="text-muted-foreground mt-1.5 leading-relaxed text-sm">
            Conectate en vivo al toque con compañeros que la tengan atada para resolver tus dudas ya mismo.
          </p>
        </div>

        {/* Tutor Availability Switch */}
        {currentUser.role_id === 3 && (
          <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-xl border border-border/20 shrink-0">
            <div className="text-right">
              <span className="text-xs text-muted-foreground block font-semibold uppercase tracking-wider">
                Tu disponibilidad
              </span>
              <span className={`text-sm font-bold block ${isAvailable ? "text-emerald-500" : "text-muted-foreground"}`}>
                {isAvailable ? "Estoy disponible" : "No disponible"}
              </span>
            </div>
            <button
              onClick={() => toggleAvailability(!isAvailable)}
              className="text-accent transition-all hover:scale-105"
            >
              {isAvailable ? (
                <ToggleRight className="w-11 h-11 fill-accent text-background" />
              ) : (
                <ToggleLeft className="w-11 h-11 text-muted-foreground" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Tutors matching list & scalability statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Matching & Availability Finder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-glass rounded-xl p-6 border border-border/40 space-y-6">
            <div className="flex items-center justify-between border-b border-border/20 pb-4">
              <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Tutores Activos en Línea
              </h2>
              <span className="bg-accent/15 text-accent px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                {Object.keys(onlineTutors).length} online
              </span>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search bar */}
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por tutor o materia..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background/50 border border-border/30 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Subject selector */}
              <div className="relative min-w-[180px]">
                <select
                  value={selectedSubjectId || ""}
                  onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-background/50 border border-border/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent appearance-none"
                >
                  <option value="">Todas las materias</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                  ▼
                </div>
              </div>
            </div>

            {/* Live Tutors Grid */}
            {loadingTutors ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <p className="text-sm mt-3">Buscando tutores activos...</p>
              </div>
            ) : filteredAvailableTutors.length === 0 ? (
              <div className="py-12 px-6 text-center border-2 border-dashed border-border/20 rounded-xl space-y-3 bg-muted/10">
                <AlertCircle className="w-10 h-10 text-muted-foreground/60 mx-auto" />
                <div>
                  <h3 className="font-semibold text-foreground text-base">No hay tutores disponibles</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                    Nadie está disponible en este momento con tus filtros. Avisale a un compañero para que active su disponibilidad.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredAvailableTutors.map((tutor) => (
                  <TutorCard
                    key={tutor.id}
                    tutor={tutor}
                    onRequestCall={handleRequestCall}
                    isRequesting={isRequesting}
                    selectedSubjectId={selectedSubjectId}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Standard Scheduled Tutorings fallback section */}
          <div className="bg-glass rounded-xl p-6 border border-border/40 space-y-4">
            <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-secondary" />
              ¿Buscás una tutoría programada?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Si preferís coordinar un encuentro grupal o programar un repaso presencial con tiempo para más adelante, podés ver las agendas fijas de los docentes en la sección de tutorías de la cátedra.
            </p>
          </div>
        </div>

        {/* Right Side: Scalable Platform Analytics Dashboard */}
        <div className="space-y-6">
          {/* Analytics Overview Card */}
          <div className="bg-glass rounded-xl p-6 border border-border/40 shadow-lg space-y-6">
            <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2 border-b border-border/20 pb-4">
              <Award className="w-5 h-5 text-accent" />
              Tu Actividad Express
            </h3>

            {loadingHistory ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {/* Metric 1 */}
                <div className="bg-muted/30 border border-border/10 p-4 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center text-accent shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-foreground block">{analytics.totalCalls}</span>
                    <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                      Consultas realizadas
                    </span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-muted/30 border border-border/10 p-4 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-foreground block">{analytics.totalMinutes} min</span>
                    <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                      Minutos de ayuda en vivo
                    </span>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-muted/30 border border-border/10 p-4 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-base font-black text-foreground block truncate max-w-[170px]">
                      {analytics.topSubject}
                    </span>
                    <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                      Materia más consultada
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Call History list */}
          <div className="bg-glass rounded-xl p-6 border border-border/40 space-y-4">
            <h3 className="font-heading font-bold text-base text-foreground">
              Historial de consultas
            </h3>
            
            {loadingHistory ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground leading-relaxed text-center py-4 bg-muted/10 rounded-xl border-2 border-dashed border-border/10">
                Aún no participaste de ninguna consulta en vivo.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto custom-scrollbar">
                {history.map((room) => {
                  const isStudent = room.student_id === currentUser.id;
                  const peer = isStudent ? room.tutor : room.student;
                  const formattedDate = new Date(room.created_at).toLocaleDateString([], {
                    day: "2-digit",
                    month: "2-digit",
                  });

                  return (
                    <div
                      key={room.id}
                      className="p-3 bg-muted/20 border border-border/10 rounded-xl flex items-center justify-between text-xs hover:bg-muted/30 transition-all"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground truncate max-w-[120px]">
                            {peer ? `${peer.name} ${peer.last_name?.[0] || ""}.` : "Compañero/a"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{formattedDate}</span>
                        </div>
                        <span className="text-accent font-medium block truncate max-w-[160px] mt-0.5">
                          {room.subject?.name || "Consulta General"}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                          room.status === "ended"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : room.status === "rejected" || room.status === "missed"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {room.status === "ended"
                          ? "Terminada"
                          : room.status === "rejected"
                          ? "Rechazada"
                          : room.status === "missed"
                          ? "Perdida"
                          : room.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
    </DashboardLayout>
  );
}
