"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createClient as createBrowserClient,
  unsubscribeRealtimeChannel,
} from "@/lib/supabase/client";
import { useGroupWebRTC, RemoteMediaState } from "@/hooks/useGroupWebRTC";
import {
  CallMessageExtended,
  CallRoomExtended,
  CallRoomParticipantExtended,
  endCall,
  fetchCallMessages,
  fetchCallRoom,
  sendCallMessage,
  startCall,
} from "@/actions/consultas";
import CallControls from "@/components/consultas/CallControls";
import CallChat from "@/components/consultas/CallChat";
import ResourcesPanel from "@/components/consultas/ResourcesPanel";
import {
  AlertTriangle,
  Clock,
  FileText,
  Info,
  Loader2,
  MessageSquare,
  PhoneOff,
  Sparkles,
  Users,
  X,
} from "lucide-react";

interface SalaClientProps {
  room: CallRoomExtended;
  isTutor: boolean;
  currentUserId: string;
}

interface CallExitNotice {
  title: string;
  message: string;
  actionLabel: string;
}

interface VideoTileProps {
  participant: CallRoomParticipantExtended;
  isCurrentUser: boolean;
  stream: MediaStream | null;
  hasVideo: boolean;
  hasAudio: boolean;
  connectionState: RTCPeerConnectionState;
  isMuted?: boolean;
  isCameraOff?: boolean;
}

function getInitials(participant: CallRoomParticipantExtended) {
  const name = participant.user?.name ?? "";
  const lastName = participant.user?.last_name ?? "";
  return `${name[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "UC";
}

function getDisplayName(participant: CallRoomParticipantExtended, isCurrentUser: boolean) {
  if (isCurrentUser) return "Vos";
  const fullName = `${participant.user?.name ?? "Compañero/a"} ${participant.user?.last_name ?? ""}`.trim();
  return fullName || "Compañero/a";
}

function getParticipantsSignature(participants: CallRoomParticipantExtended[]) {
  return participants
    .map((participant) => `${participant.user_id}:${participant.joined_at}:${participant.left_at ?? ""}`)
    .sort()
    .join("|");
}

function VideoTile({
  participant,
  isCurrentUser,
  stream,
  hasVideo,
  hasAudio,
  connectionState,
  isMuted = false,
  isCameraOff = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayName = getDisplayName(participant, isCurrentUser);
  const roleLabel = participant.is_host ? "Tutor anfitrión" : "Estudiante";
  const statusText = (() => {
    if (stream) {
      if (!hasVideo && isCameraOff && isMuted) return "Sin cámara ni micrófono";
      if (!hasVideo && isCameraOff) return hasAudio ? "Audio conectado" : "Cámara apagada";
      if (hasAudio) return "Audio conectado";
      return "En la sala";
    }

    if (isCameraOff && isMuted) return "Sin cámara ni micrófono";
    if (isCameraOff) return "Cámara apagada";
    if (isMuted) return "Micrófono apagado";
    if (connectionState === "connecting") return "Conectando...";
    if (connectionState === "new") return "Esperando conexión...";
    return `RTC: ${connectionState}`;
  })();

  const showLoader = !isCurrentUser && connectionState !== "connected" && connectionState !== "failed";

  useEffect(() => {
    if (!videoRef.current) return;

    if (!stream || !hasVideo) {
      videoRef.current.srcObject = null;
      return;
    }

    videoRef.current.srcObject = stream;
    void videoRef.current.play().catch(() => {
      // The element is muted/playsInline where needed, so autoplay races can be ignored.
    });
  }, [stream, hasVideo]);

  return (
    <div className="relative h-full min-h-0 rounded-xl overflow-hidden border border-border/20 bg-muted/20 shadow-xl">
      {stream && hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isCurrentUser}
          className={`absolute inset-0 w-full h-full object-cover ${isCurrentUser ? "-scale-x-100" : ""}`}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-muted/20">
          <div className="relative w-20 h-20 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-heading font-black text-xl shadow-lg shadow-accent/10">
            {showLoader ? <Loader2 className="w-8 h-8 animate-spin" /> : getInitials(participant)}
          </div>
          <h4 className="mt-4 font-heading font-bold text-sm text-foreground">
            {displayName}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {statusText}
          </p>
        </div>
      )}

      <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between gap-2">
        <div className="min-w-0 rounded-lg bg-background/80 border border-border/20 px-3 py-2 backdrop-blur-md shadow-lg">
          <span className="block truncate text-xs font-bold text-foreground">
            {displayName}
          </span>
          <span className="block truncate text-[10px] text-muted-foreground mt-0.5">
            {roleLabel}
          </span>
        </div>
        <div
          className={`w-2.5 h-2.5 rounded-full shrink-0 border border-background ${
            connectionState === "connected" || isCurrentUser
              ? "bg-emerald-500"
              : connectionState === "connecting"
              ? "bg-accent animate-pulse"
              : "bg-muted-foreground"
          }`}
          title={connectionState}
        />
      </div>

      {isMuted && (
        <span className="absolute top-3 right-3 rounded-full bg-destructive/15 border border-destructive/25 px-2 py-1 text-[10px] font-bold text-destructive">
          Mic off
        </span>
      )}
    </div>
  );
}

export default function SalaClient({
  room,
  isTutor,
  currentUserId,
}: SalaClientProps) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endingByMeRef = useRef(false);

  const [participants, setParticipants] = useState<CallRoomParticipantExtended[]>(
    room.participants
  );
  const [messages, setMessages] = useState<CallMessageExtended[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "resources">("chat");
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [callExitNotice, setCallExitNotice] = useState<CallExitNotice | null>(null);
  const [visibleMediaInfo, setVisibleMediaInfo] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  const showChatRef = useRef(showChat);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    showChatRef.current = showChat;
    activeTabRef.current = activeTab;
  }, [showChat, activeTab]);

  const activeParticipants = useMemo(
    () =>
      participants
        .filter((participant) => !participant.left_at)
        .sort((a, b) => Number(b.is_host) - Number(a.is_host) || a.joined_at.localeCompare(b.joined_at)),
    [participants]
  );

  const refreshParticipants = useCallback(async () => {
    const res = await fetchCallRoom(room.id);
    if (!res.success || !res.data) return;
    const nextParticipants = res.data.participants;

    setParticipants((current) => {
      return getParticipantsSignature(current) === getParticipantsSignature(nextParticipants)
        ? current
        : nextParticipants;
    });
  }, [room.id]);

  const {
    localStream,
    remoteMedia,
    connectionState,
    mediaMode,
    mediaWarning,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
  } = useGroupWebRTC({
    roomId: room.id,
    currentUserId,
    participants: activeParticipants,
    onFailed: (errorMsg) => setConnectionError(errorMsg),
  });

  useEffect(() => {
    if (connectionState === "connected" && room.status !== "active") {
      void startCall(room.id);
    }
  }, [connectionState, room.id, room.status]);

  useEffect(() => {
    async function loadMessages() {
      const res = await fetchCallMessages(room.id);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    }

    void loadMessages();

    const channel = supabase
      .channel(`chat_room_${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_messages",
          filter: `room_id=eq.${room.id}`,
        },
        async () => {
          const res = await fetchCallMessages(room.id);
          if (res.success && res.data) {
            setMessages(res.data);
            const latest = res.data[res.data.length - 1];
            if (latest && latest.sender_id !== currentUserId && (!showChatRef.current || activeTabRef.current !== "chat")) {
              setUnreadCount((count) => count + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      unsubscribeRealtimeChannel(channel);
    };
  }, [currentUserId, room.id, supabase]);

  useEffect(() => {
    void refreshParticipants();

    const channel = supabase
      .channel(`room_participants_${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "call_room_participants",
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          void refreshParticipants();
        }
      )
      .subscribe();

    return () => {
      unsubscribeRealtimeChannel(channel);
    };
  }, [refreshParticipants, room.id, supabase]);

  useEffect(() => {
    const interval = setInterval(() => {
      void refreshParticipants();
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshParticipants]);

  useEffect(() => {
    const scheduleReturnToTutorias = () => {
      if (redirectTimeoutRef.current) return;
      redirectTimeoutRef.current = setTimeout(() => {
        router.push("/tutorias");
      }, 1800);
    };

    const channel = supabase
      .channel(`room_lifecycle_${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "call_rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const updatedRoom = payload.new as Partial<CallRoomExtended>;
          if (updatedRoom.status === "ended" || updatedRoom.status === "rejected") {
            setCallExitNotice({
              title: "Tutoría finalizada",
              message: endingByMeRef.current
                ? "Cerraste la sala. Te llevamos de vuelta a Tutorías."
                : "La tutoría terminó. Te llevamos de vuelta a Tutorías.",
              actionLabel: "Volver ahora",
            });
            scheduleReturnToTutorias();
          }
        }
      )
      .subscribe();

    return () => {
      unsubscribeRealtimeChannel(channel);
    };
  }, [room.id, router, supabase]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!mediaWarning) {
      setVisibleMediaInfo(null);
      return;
    }

    setVisibleMediaInfo(mediaWarning);
    const timeout = setTimeout(() => {
      setVisibleMediaInfo(null);
    }, 4500);

    return () => clearTimeout(timeout);
  }, [mediaWarning]);

  const handleSendMessage = async (content: string) => {
    await sendCallMessage(room.id, content);
  };

  const handleEndCall = async () => {
    endingByMeRef.current = true;
    setCallExitNotice({
      title: isTutor ? "Cerrando tutoría" : "Saliendo de la tutoría",
      message: isTutor
        ? "Estamos cerrando la sala para todos."
        : "Estamos guardando tu salida de la sala.",
      actionLabel: "Volver ahora",
    });

    const res = await endCall(room.id);
    if (!res.success) {
      endingByMeRef.current = false;
      setCallExitNotice({
        title: "No pudimos cerrar la sala",
        message: res.error || "Intentá de nuevo en unos segundos.",
        actionLabel: "Entendido",
      });
      return;
    }

    if (!isTutor) {
      router.push("/tutorias");
      return;
    }

    setCallExitNotice({
      title: "Tutoría finalizada",
      message: "Cerraste la sala. Te llevamos de vuelta a Tutorías.",
      actionLabel: "Volver ahora",
    });

    if (!redirectTimeoutRef.current) {
      redirectTimeoutRef.current = setTimeout(() => {
        router.push("/tutorias");
      }, 1200);
    }
  };

  const toggleChatPanel = () => {
    setShowChat(!showChat);
    if (!showChat && activeTab === "chat") {
      setUnreadCount(0);
    }
  };

  const handleTabChange = (tab: "chat" | "resources") => {
    setActiveTab(tab);
    if (tab === "chat") {
      setUnreadCount(0);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const mediaInfoTitle = mediaMode === "chat-only" ? "Modo chat" : "Modo sin cámara";
  const gridClass =
    activeParticipants.length <= 1
      ? "grid-cols-1"
      : activeParticipants.length === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-2";

  return (
    <div className="h-full min-h-0 grid grid-rows-[auto_minmax(0,1fr)_auto] gap-4 relative">
      {callExitNotice && (
        <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-xl border border-border/40 bg-glass shadow-2xl p-6 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-destructive/15 border border-destructive/25 flex items-center justify-center mx-auto text-destructive">
              <PhoneOff className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading font-black text-xl text-foreground">
                {callExitNotice.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {callExitNotice.message}
              </p>
            </div>
            <button
              onClick={() => router.push("/tutorias")}
              className="w-full h-11 rounded-xl bg-accent text-accent-foreground font-bold text-sm shadow-lg shadow-accent/10 hover:bg-accent/90 transition-all hover:scale-[1.01] focus:outline-none"
            >
              {callExitNotice.actionLabel}
            </button>
          </div>
        </div>
      )}

      <div className="bg-glass px-4 py-2 sm:px-6 sm:py-3 rounded-xl border border-border/20 flex flex-row items-center justify-between gap-3 shadow-lg z-10 backdrop-blur-xl shrink-0 w-full">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-accent animate-pulse shrink-0" />
          <div className="min-w-0">
            <h2 className="font-heading font-black text-xs sm:text-sm text-foreground flex items-center gap-1.5 leading-none truncate">
              Tutoría en Vivo
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse shrink-0 hidden sm:inline" />
            </h2>
            <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 block leading-none truncate">
              Materia: <span className="text-accent font-semibold">{room.subject?.name || "General"}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1 sm:gap-1.5 bg-muted/40 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-border/10 text-[10px] sm:text-xs font-mono font-bold shrink-0">
            <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-accent shrink-0" />
            <span>{formatTime(callDuration)}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 bg-muted/40 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-border/10 text-[10px] sm:text-xs font-bold shrink-0">
            <Users className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-accent shrink-0" />
            <span>{activeParticipants.length}/{room.max_participants}</span>
          </div>
        </div>
      </div>

      <div className="relative flex-grow min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        <div className={`relative grid grid-rows-[minmax(0,1fr)_auto_auto] min-h-0 bg-obsidian rounded-xl overflow-hidden border border-border/20 shadow-2xl p-3 transition-all ${
          showChat ? "lg:col-span-2" : "lg:col-span-3"
        }`}>
          <div className={`grid ${gridClass} auto-rows-fr gap-3 h-full min-h-0 overflow-hidden`}>
            {activeParticipants.map((participant) => {
              const isCurrentUser = participant.user_id === currentUserId;
              const remoteState: RemoteMediaState | undefined = remoteMedia[participant.user_id];
              const stream = isCurrentUser ? localStream : remoteState?.stream ?? null;
              const hasVideo = isCurrentUser
                ? Boolean(localStream?.getVideoTracks().some((track) => track.readyState === "live")) && !isCameraOff
                : Boolean(remoteState?.hasVideo);
              const hasAudio = isCurrentUser
                ? Boolean(localStream?.getAudioTracks().some((track) => track.readyState === "live")) && !isMuted
                : Boolean(remoteState?.hasAudio);

              return (
                <VideoTile
                  key={participant.user_id}
                  participant={participant}
                  isCurrentUser={isCurrentUser}
                  stream={stream}
                  hasVideo={hasVideo}
                  hasAudio={hasAudio}
                  connectionState={isCurrentUser ? "connected" : remoteState?.connectionState ?? "new"}
                  isMuted={isCurrentUser ? isMuted : remoteState?.audioEnabled === false}
                  isCameraOff={isCurrentUser ? isCameraOff : remoteState?.videoEnabled === false}
                />
              );
            })}
          </div>

          {activeParticipants.length === 1 && isTutor && (
            <div className="mt-3 rounded-xl border border-border/20 bg-background/70 px-4 py-3 backdrop-blur-md shrink-0">
              <p className="text-sm font-semibold text-foreground">Esperando estudiantes...</p>
              <p className="text-xs text-muted-foreground mt-1">
                La sala está abierta. Cuando alguien toque “Solicitar acceso”, va a entrar acá.
              </p>
            </div>
          )}

          {connectionError && (
            <div className="mt-3 bg-destructive/15 text-destructive border border-destructive/25 p-3.5 rounded-xl flex items-start gap-3 shadow-2xl backdrop-blur-md shrink-0">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h5 className="font-heading font-black text-sm uppercase tracking-wider leading-none">
                  Falla de conexión
                </h5>
                <p className="text-xs mt-1 leading-relaxed">{connectionError}</p>
              </div>
            </div>
          )}

          {visibleMediaInfo && !connectionError && (
            <div className="mt-3 bg-card/90 text-foreground border border-border/40 p-3.5 rounded-xl flex items-start gap-3 shadow-2xl backdrop-blur-md animate-fade-in shrink-0">
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-accent" />
              <div className="flex-1 min-w-0">
                <h5 className="font-heading font-black text-sm text-foreground uppercase tracking-wider leading-none">
                  {mediaInfoTitle}
                </h5>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {visibleMediaInfo}
                </p>
              </div>
            </div>
          )}
        </div>

        {showChat && (
          <div className="absolute inset-0 z-30 lg:static lg:z-auto flex flex-col h-full min-h-0 lg:col-span-1 min-w-0 overflow-hidden bg-background/95 lg:bg-transparent p-4 lg:p-0 rounded-xl border border-border/20 lg:border-none shadow-2xl lg:shadow-none backdrop-blur-md lg:backdrop-blur-none">
            <div className="flex border-b border-border/20 mb-3 bg-glass p-1 rounded-xl gap-1 shrink-0 border items-center">
              <button
                onClick={() => handleTabChange("chat")}
                className={`flex-grow flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "chat"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => handleTabChange("resources")}
                className={`flex-grow flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "resources"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Apuntes</span>
              </button>
              
              <button
                onClick={() => setShowChat(false)}
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/30 transition-all shrink-0 ml-1"
                title="Volver a la llamada"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-grow min-h-0">
              {activeTab === "chat" ? (
                <CallChat
                  messages={messages}
                  currentUserId={currentUserId}
                  onSendMessage={handleSendMessage}
                />
              ) : (
                <ResourcesPanel subjectId={room.subject_id} />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center shrink-0">
        <CallControls
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onEndCall={handleEndCall}
          showChat={showChat}
          onToggleChat={toggleChatPanel}
          unreadCount={unreadCount}
        />
      </div>
    </div>
  );
}
