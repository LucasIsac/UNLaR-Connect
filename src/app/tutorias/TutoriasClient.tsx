"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
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
import {
  TutorProfileForMatching,
  ScheduledSessionExtended,
  TutoringCalendarEvent,
  fetchTutorProfilesForMatching,
  fetchScheduledSessions,
  fetchTutoringCalendar,
  respondToScheduledTutoring,
  cancelScheduledSession,
} from "@/actions/tutoring-scheduled";
import TutorCard from "@/components/consultas/TutorCard";
import ScheduledTutorCard from "@/components/consultas/ScheduledTutorCard";
import RequestTutoringModal from "@/components/consultas/RequestTutoringModal";
import TutoringCalendar from "@/components/consultas/TutoringCalendar";
import IncomingCallBanner from "@/components/consultas/IncomingCallBanner";
import { Select } from "@/components/ui/Select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Video, 
  Calendar, 
  ToggleLeft, 
  ToggleRight, 
  Users, 
  Search, 
  Clock, 
  Award,
  BookOpen, 
  CheckCircle,
  Loader2,
  AlertCircle,
  Check,
  X,
  CalendarDays,
  List
} from "lucide-react";
import { DbSubject } from "@/types/database";
import type { CombinedHeaderData } from "@/actions/perfil";

type TabType = "live" | "scheduled";
type IncomingCall = {
  roomId: string;
  studentName: string;
  subjectName: string;
};
type CallRoomRealtimeRow = {
  id: string;
  status: string;
  student_id: string;
  subject_id: number | null;
};

interface TutoriasClientProps {
  currentUser: {
    id: string;
    name: string;
    last_name: string;
    role_id: number; // 1 = Tutor, 2 = Student, 3 = TutorActive
    avatar_url?: string;
  };
  initialHeaderData?: CombinedHeaderData;
}

export default function TutoriasClient({ currentUser, initialHeaderData }: TutoriasClientProps) {
  const router = useRouter();
  const supabase = createBrowserClient();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("live");

  // Common state
  const [subjects, setSubjects] = useState<DbSubject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const subjectOptions = [
    { value: "", label: "Todas las materias" },
    ...subjects.map((sub) => ({ value: sub.id, label: sub.name })),
  ];
  
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

  // ==================== LIVE TAB STATE ====================
  const [allTutors, setAllTutors] = useState<AvailableTutor[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCallRoomId, setActiveCallRoomId] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [pendingCallMessage, setPendingCallMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<CallRoomExtended[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // ==================== SCHEDULED TAB STATE ====================
  const [tutorProfiles, setTutorProfiles] = useState<TutorProfileForMatching[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState<TutorProfileForMatching | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSessionExtended[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<TutoringCalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // ==================== DATA LOADING ====================
  useEffect(() => {
    async function loadInitialData() {
      try {
        const { data: subs } = await supabase.from("subjects").select("*").order("name");
        setSubjects(subs || []);

        const tutorsRes = await fetchAvailableTutors();
        if (tutorsRes.success && tutorsRes.data) {
          setAllTutors(tutorsRes.data);
        }

        const historyRes = await fetchCallHistory();
        if (historyRes.success && historyRes.data) {
          setHistory(historyRes.data);
        }

        const profilesRes = await fetchTutorProfilesForMatching();
        if (profilesRes.success && profilesRes.data) {
          setTutorProfiles(profilesRes.data);
        }

        const sessionsRes = await fetchScheduledSessions();
        if (sessionsRes.success && sessionsRes.data) {
          setScheduledSessions(sessionsRes.data);
        }

        const calendarRes = await fetchTutoringCalendar();
        if (calendarRes.success && calendarRes.data) {
          setCalendarEvents(calendarRes.data);
        }
      } catch (err) {
        console.error("Error loading tutorias initial data:", err);
      } finally {
        setLoadingTutors(false);
        setLoadingHistory(false);
        setLoadingProfiles(false);
        setLoadingSessions(false);
      }
    }

    loadInitialData();
  }, []);

  // ==================== REALTIME SUBSCRIPTIONS ====================
  useEffect(() => {
    if (currentUser.role_id !== 1 && currentUser.role_id !== 3) return;

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
        async (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const newRoom = payload.new as Partial<CallRoomRealtimeRow>;
          if (newRoom.status === "requested" && newRoom.id && newRoom.student_id) {
            const { data: student } = await supabase
              .from("users")
              .select("name, last_name")
              .eq("id", newRoom.student_id)
              .single();

            let subjectName = "Consulta Express";
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
  }, [currentUser.id, currentUser.role_id, supabase]);

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
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const updatedRoom = payload.new as Partial<CallRoomRealtimeRow>;
          if (updatedRoom.status === "accepted" || updatedRoom.status === "active") {
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

  // ==================== LIVE TAB HANDLERS ====================
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

  const handleRejectCall = async () => {
    if (!incomingCall) return;
    setIsResponding(true);
    await respondToCall(incomingCall.roomId, false);
    setIsResponding(false);
    setIncomingCall(null);
  };

  const getAvailableTutors = (): AvailableTutor[] => {
    return allTutors.filter((tutor) => {
      const isOnline = onlineTutors[tutor.id]?.available;
      if (!isOnline) return false;

      if (selectedSubjectId) {
        const teachesSubject = tutor.subjects.some((s) => s.id === selectedSubjectId);
        if (!teachesSubject) return false;
      }

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

  // ==================== SCHEDULED TAB HANDLERS ====================
  const handleRequestTutoring = (tutor: TutorProfileForMatching) => {
    setSelectedTutor(tutor);
    setShowRequestModal(true);
  };

  const handleRequestSuccess = async () => {
    setShowRequestModal(false);
    setSelectedTutor(null);
    
    const sessionsRes = await fetchScheduledSessions();
    if (sessionsRes.success && sessionsRes.data) {
      setScheduledSessions(sessionsRes.data);
    }

    const calendarRes = await fetchTutoringCalendar();
    if (calendarRes.success && calendarRes.data) {
      setCalendarEvents(calendarRes.data);
    }
  };

  const handleSessionResponse = async (sessionId: string, accept: boolean) => {
    try {
      const result = await respondToScheduledTutoring(sessionId, accept);
      if (result.success) {
        const sessionsRes = await fetchScheduledSessions();
        if (sessionsRes.success && sessionsRes.data) {
          setScheduledSessions(sessionsRes.data);
        }

        const calendarRes = await fetchTutoringCalendar();
        if (calendarRes.success && calendarRes.data) {
          setCalendarEvents(calendarRes.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      const result = await cancelScheduledSession(sessionId);
      if (result.success) {
        const sessionsRes = await fetchScheduledSessions();
        if (sessionsRes.success && sessionsRes.data) {
          setScheduledSessions(sessionsRes.data);
        }

        const calendarRes = await fetchTutoringCalendar();
        if (calendarRes.success && calendarRes.data) {
          setCalendarEvents(calendarRes.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getFilteredTutorProfiles = (): TutorProfileForMatching[] => {
    return tutorProfiles.filter((profile) => {
      if (selectedSubjectId) {
        const teachesSubject = profile.subjects.some((s) => s.id === selectedSubjectId);
        if (!teachesSubject) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = `${profile.name} ${profile.last_name}`.toLowerCase();
        const matchesName = fullName.includes(query);
        const matchesSubject = profile.subjects.some((s) => s.name.toLowerCase().includes(query));
        if (!matchesName && !matchesSubject) return false;
      }

      return true;
    });
  };

  const filteredTutorProfiles = getFilteredTutorProfiles();

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

  const pendingSessionsCount = scheduledSessions.filter(s => s.status === "pending").length;
  const isTutor = currentUser.role_id === 1 || currentUser.role_id === 3;

  return (
    <DashboardLayout initialHeaderData={initialHeaderData} showSearch={false}>
      <div className="space-y-4 animate-fade-in pb-6">
      {incomingCall && (
        <IncomingCallBanner
          studentName={incomingCall.studentName}
          subjectName={incomingCall.subjectName}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          isResponding={isResponding}
        />
      )}

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

      {showRequestModal && selectedTutor && (
        <RequestTutoringModal
          tutor={selectedTutor}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedTutor(null);
          }}
          onSuccess={handleRequestSuccess}
        />
      )}

      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight mb-1 text-cream-bone flex items-center gap-2">
              <Video className="w-6 h-6 text-accent animate-pulse shrink-0" />
              Tutorías P2P
            </h1>
            <p className="text-sm text-muted-foreground">
              Conectate con compañeros para resolver dudas en vivo o agendar tutorías programadas.
            </p>
          </div>

          {isTutor && (
            <div className="flex items-center gap-2 bg-glass py-1.5 px-3 rounded-xl border border-border/40 shrink-0 select-none">
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider">
                  Tu disponibilidad
                </span>
                <span className={`text-xs font-bold block ${isAvailable ? "text-emerald-500" : "text-muted-foreground"}`}>
                  {isAvailable ? "Estoy disponible" : "No disponible"}
                </span>
              </div>
              <button
                onClick={() => toggleAvailability(!isAvailable)}
                className="text-accent transition-all hover:scale-105"
              >
                {isAvailable ? (
                  <ToggleRight className="w-9 h-9 fill-accent text-background" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-muted-foreground" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="pt-3 border-t border-border/10">
          <div className="flex gap-1.5 p-0.5 bg-muted/30 rounded-xl border border-border/20 max-w-xs select-none">
            <button
              onClick={() => setActiveTab("live")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "live"
                  ? "bg-accent text-accent-foreground shadow-md shadow-accent/10 animate-fade-in"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              En vivo
            </button>
            <button
              onClick={() => setActiveTab("scheduled")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                activeTab === "scheduled"
                  ? "bg-accent text-accent-foreground shadow-md shadow-accent/10 animate-fade-in"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Programadas
              {pendingSessionsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingSessionsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ==================== LIVE TAB CONTENT ==================== */}
      {activeTab === "live" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Left Column (Main Area) - Spans 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Tutores Activos en Línea */}
            <div className="bg-glass rounded-2xl p-4 sm:p-5 border border-border/40 space-y-4">
              <div className="flex items-center justify-between border-b border-border/20 pb-2.5">
                <h2 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-accent" />
                  Tutores Activos en Línea
                </h2>
                <span className="bg-accent/15 text-accent px-2.5 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                  {Object.keys(onlineTutors).length} online
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por tutor o materia..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-background/50 border border-border/30 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="min-w-[180px] w-full sm:w-auto">
                  <Select
                    value={selectedSubjectId || ""}
                    onChange={(val) => setSelectedSubjectId(val ? Number(val) : null)}
                    options={subjectOptions}
                    placeholder="Todas las materias"
                    className="bg-background/50 border border-border/30 rounded-xl px-3 py-2 text-xs focus-within:ring-1 focus-within:ring-accent focus:outline-none font-sans"
                  />
                </div>
              </div>

              {loadingTutors ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-glass rounded-xl p-4 border border-border/20 space-y-3 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted/60" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 bg-muted/60 rounded-md w-3/4" />
                          <div className="h-2.5 bg-muted/40 rounded-md w-1/2" />
                        </div>
                      </div>
                      <div className="h-8 bg-muted/40 rounded-xl w-full mt-1" />
                    </div>
                  ))}
                </div>
              ) : filteredAvailableTutors.length === 0 ? (
                <div className="py-8 px-4 text-center border-2 border-dashed border-border/20 rounded-xl space-y-2 bg-muted/10">
                  <AlertCircle className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                  <div>
                    <h3 className="font-semibold text-foreground text-xs">No hay tutores disponibles</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs mx-auto leading-relaxed">
                      Nadie está disponible en este momento con tus filtros. Avisale a un compañero para que active su disponibilidad.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            {/* Historial de consultas */}
            <div className="bg-glass rounded-2xl p-4 sm:p-5 border border-border/40 space-y-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/20 pb-2.5">
                <Clock className="w-4 h-4 text-accent" />
                Historial de consultas
              </h3>
              
              {loadingHistory ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-2.5 bg-muted/20 border border-border/10 rounded-xl flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="h-3 bg-muted/50 rounded-md w-1/3" />
                        <div className="h-2 bg-muted/30 rounded-md w-1/4" />
                      </div>
                      <div className="w-12 h-4 bg-muted/40 rounded-full shrink-0" />
                    </div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground leading-relaxed text-center py-4 bg-muted/10 rounded-xl border border-dashed border-border/10">
                  Aún no participaste de ninguna consulta en vivo.
                </p>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
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
                        className="p-2.5 bg-muted/20 border border-border/10 rounded-xl flex items-center justify-between text-xs hover:bg-muted/30 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground truncate max-w-[150px]">
                              {peer ? `${peer.name} ${peer.last_name?.[0] || ""}.` : "Compañero/a"}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">{formattedDate}</span>
                          </div>
                          <span className="text-accent font-semibold block truncate max-w-[200px] mt-0.5 text-[11px]">
                            {room.subject?.name || "Consulta General"}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[8px] ${
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

          {/* Right Column (Sidebar) - Spans 1/3 */}
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-glass rounded-2xl p-4 sm:p-5 border border-border/40 shadow-lg space-y-4">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/20 pb-2.5">
                <Award className="w-4 h-4 text-accent" />
                Tu Actividad Express
              </h3>

              {loadingHistory ? (
                <div className="grid grid-cols-1 gap-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-muted/30 border border-border/10 p-3 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted/50 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 bg-muted/60 rounded-md w-1/3" />
                        <div className="h-2.5 bg-muted/40 rounded-md w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-muted/20 border border-border/10 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent shrink-0">
                      <CheckCircle className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-lg font-black text-foreground block leading-tight">{analytics.totalCalls}</span>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                        Consultas realizadas
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/20 border border-border/10 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary shrink-0">
                      <Clock className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-lg font-black text-foreground block leading-tight">{analytics.totalMinutes} min</span>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                        Minutos de ayuda en vivo
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/20 border border-border/10 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500 shrink-0">
                      <BookOpen className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-foreground block truncate leading-tight">
                        {analytics.topSubject}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block mt-0.5">
                        Materia más consultada
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ==================== SCHEDULED TAB CONTENT ==================== */}
      {activeTab === "scheduled" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-glass rounded-2xl p-4 sm:p-5 border border-border/40 space-y-4">
              <div className="flex items-center justify-between border-b border-border/20 pb-2.5">
                <h2 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-accent" />
                  Tutores Disponibles
                </h2>
                <span className="bg-accent/15 text-accent px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  {filteredTutorProfiles.length} tutores
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por tutor o materia..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-background/50 border border-border/30 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="min-w-[180px] w-full sm:w-auto">
                  <Select
                    value={selectedSubjectId || ""}
                    onChange={(val) => setSelectedSubjectId(val ? Number(val) : null)}
                    options={subjectOptions}
                    placeholder="Todas las materias"
                    className="bg-background/50 border border-border/30 rounded-xl px-3 py-2 text-xs focus-within:ring-1 focus-within:ring-accent focus:outline-none font-sans"
                  />
                </div>
              </div>
            </div>

            {loadingProfiles ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-glass rounded-xl p-4 border border-border/20 space-y-3 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted/60" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-muted/60 rounded-md w-3/4" />
                        <div className="h-2.5 bg-muted/45 rounded-md w-1/2" />
                      </div>
                    </div>
                    <div className="h-8 bg-muted/40 rounded-xl w-full mt-2" />
                  </div>
                ))}
              </div>
            ) : filteredTutorProfiles.length === 0 ? (
              <div className="py-8 px-4 text-center border-2 border-dashed border-border/20 rounded-xl space-y-2 bg-muted/10">
                <AlertCircle className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                <div>
                  <h3 className="font-semibold text-foreground text-xs">No hay tutores disponibles</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs mx-auto leading-relaxed">
                    No se encontraron tutores con los filtros seleccionados. Probá con otros términos.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTutorProfiles.map((tutor) => (
                  <ScheduledTutorCard
                    key={tutor.id}
                    tutor={tutor}
                    onRequestTutoring={handleRequestTutoring}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-glass rounded-2xl p-2.5 border border-border/40 shadow-sm">
              <div className="flex gap-1.5 p-0.5 bg-muted/30 rounded-lg">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                    viewMode === "list"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  Lista
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                    viewMode === "calendar"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Calendario
                </button>
              </div>
            </div>

            {viewMode === "calendar" && (
              <TutoringCalendar
                events={calendarEvents}
                onEventClick={(event) => {
                  console.log("Event clicked:", event);
                }}
              />
            )}

            {viewMode === "list" && (
              <div className="bg-glass rounded-2xl p-4 sm:p-5 border border-border/40 space-y-3 shadow-md">
                <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/20 pb-2.5">
                  <Calendar className="w-4.5 h-4.5 text-accent" />
                  Mis Tutorías Programadas
                </h3>

                {loadingSessions ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-4 rounded-xl border border-border/10 bg-muted/20 space-y-3">
                        <div className="flex justify-between">
                          <div className="space-y-1.5 flex-1">
                            <div className="h-4 bg-muted/50 rounded-md w-2/3" />
                            <div className="h-3 bg-muted/30 rounded-md w-1/2" />
                          </div>
                          <div className="w-16 h-5 bg-muted/40 rounded-full shrink-0" />
                        </div>
                        <div className="flex gap-2">
                          <div className="h-3 bg-muted/30 rounded w-16" />
                          <div className="h-3 bg-muted/30 rounded w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : scheduledSessions.length === 0 ? (
                  <div className="py-8 px-4 text-center border-2 border-dashed border-border/20 rounded-xl space-y-3 bg-muted/10">
                    <Calendar className="w-8 h-8 text-muted-foreground/50 mx-auto" />
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">Sin tutorías programadas</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Elegí un tutor y solicitá una tutoría para comenzar.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {scheduledSessions.map((session) => {
                      const isPending = session.status === "pending";
                      const isConfirmed = session.status === "confirmed";
                      const isCanceled = session.status === "canceled";
                      const isTutorRole = session.tutor_id === currentUser.id;
                      const peer = isTutorRole ? session.student : session.tutor;

                      const formattedDate = new Date(session.scheduled_start).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                      });
                      const startTime = new Date(session.scheduled_start).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const endTime = new Date(session.scheduled_end).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={session.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isPending
                              ? "bg-accent/5 border-accent/20"
                              : isConfirmed
                              ? "bg-emerald-500/5 border-emerald-500/20"
                              : isCanceled
                              ? "bg-destructive/5 border-destructive/20"
                              : "bg-muted/20 border-border/10"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-foreground truncate">
                                {session.subject?.name || "Tutoría"}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {isTutorRole ? "Alumno:" : "Tutor:"} {peer?.name} {peer?.last_name}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isPending
                                  ? "bg-accent/20 text-accent"
                                  : isConfirmed
                                  ? "bg-emerald-500/20 text-emerald-500"
                                  : isCanceled
                                  ? "bg-destructive/20 text-destructive"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {isPending ? "Pendiente" : isConfirmed ? "Confirmada" : isCanceled ? "Cancelada" : "Completada"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                            <Calendar className="w-3 h-3" />
                            <span>{formattedDate}</span>
                            <Clock className="w-3 h-3 ml-2" />
                            <span>{startTime} - {endTime}</span>
                          </div>

                          <div className="flex gap-2">
                            {isPending && isTutorRole && (
                              <>
                                <button
                                  onClick={() => handleSessionResponse(session.id, true)}
                                  className="flex-1 h-8 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Aceptar
                                </button>
                                <button
                                  onClick={() => handleSessionResponse(session.id, false)}
                                  className="flex-1 h-8 border border-border hover:border-destructive hover:text-destructive bg-card/20 text-muted-foreground text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Rechazar
                                </button>
                              </>
                            )}

                            {isPending && !isTutorRole && (
                              <button
                                onClick={() => handleCancelSession(session.id)}
                                className="flex-1 h-8 border border-border hover:border-destructive hover:text-destructive bg-card/20 text-muted-foreground text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                                Cancelar solicitud
                              </button>
                            )}

                            {isConfirmed && session.meeting_link && (
                              <a
                                href={session.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 h-8 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                              >
                                <Video className="w-3.5 h-3.5" />
                                Unirse a la llamada
                              </a>
                            )}

                            {isConfirmed && !isTutorRole && (
                              <button
                                onClick={() => handleCancelSession(session.id)}
                                className="h-8 px-3 border border-border hover:border-destructive hover:text-destructive bg-card/20 text-muted-foreground text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
