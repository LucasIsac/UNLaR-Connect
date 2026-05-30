"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createClient as createBrowserClient,
  unsubscribeRealtimeChannel,
} from "@/lib/supabase/client";
import Image from "next/image";
import { useWebRTC } from "@/hooks/useWebRTC";
import { 
  CallRoomExtended, 
  endCall, 
  sendCallMessage, 
  fetchCallMessages,
  startCall 
} from "@/actions/consultas";
import CallControls from "@/components/consultas/CallControls";
import CallChat from "@/components/consultas/CallChat";
import ResourcesPanel from "@/components/consultas/ResourcesPanel";
import { DbCallMessage } from "@/types/database";
import { 
  Loader2, 
  PhoneOff, 
  MessageSquare, 
  FileText, 
  User, 
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  GripHorizontal,
  Maximize2,
  Minimize2
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

interface PreviewPosition {
  x: number;
  y: number;
}

export default function SalaClient({
  room,
  isTutor,
  currentUserId,
}: SalaClientProps) {
  const router = useRouter();
  const supabase = createBrowserClient();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const videoStageRef = useRef<HTMLDivElement>(null);
  const localPreviewRef = useRef<HTMLDivElement>(null);
  const endingByMeRef = useRef(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<DbCallMessage[]>([]);
  const [showChat, setShowChat] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "resources">("chat");
  const [unreadCount, setUnreadCount] = useState(0);
  const [callExitNotice, setCallExitNotice] = useState<CallExitNotice | null>(null);
  const [visibleMediaInfo, setVisibleMediaInfo] = useState<string | null>(null);
  const [isLocalPreviewCollapsed, setIsLocalPreviewCollapsed] = useState(false);
  const [localPreviewPosition, setLocalPreviewPosition] = useState<PreviewPosition | null>(null);

  // Call timer state
  const [callDuration, setCallDuration] = useState(0);

  // Initialize WebRTC Peer Connection and Streams
  const {
    localStream,
    remoteStream,
    remoteHasAudio,
    remoteHasVideo,
    connectionState,
    mediaMode,
    mediaWarning,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
  } = useWebRTC({
    roomId: room.id,
    isTutor,
    currentUserId,
    onConnectionStateChange: (state) => {
      if (state === "connected") {
        // Automatically set call room active in database if not already
        if (room.status !== "active") {
          startCall(room.id);
        }
      }
    },
    onFailed: (errorMsg) => {
      setConnectionError(errorMsg);
    },
  });

  // Attach local stream to video ref
  useEffect(() => {
    if (!localVideoRef.current) return;

    if (!localStream || isCameraOff || isLocalPreviewCollapsed) {
      localVideoRef.current.srcObject = null;
      return;
    }

    localVideoRef.current.srcObject = localStream;
    void localVideoRef.current.play().catch(() => {
      // The element is muted and playsInline, so autoplay should work. Ignore
      // transient play races while React remounts the preview.
    });
  }, [localStream, isCameraOff, isLocalPreviewCollapsed]);

  // Attach remote stream to video ref
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Load chat messages and listen to real-time additions
  useEffect(() => {
    async function loadMessages() {
      const res = await fetchCallMessages(room.id);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    }

    loadMessages();

    // Listen to real-time call_messages inserts
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
        (payload) => {
          const newMsg = payload.new as DbCallMessage;
          setMessages((prev) => {
            // Avoid duplicate additions
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Trigger unread notification counter if panel is closed/tab is resources
          if (newMsg.sender_id !== currentUserId) {
            if (!showChat || activeTab !== "chat") {
              setUnreadCount((c) => c + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      unsubscribeRealtimeChannel(channel);
    };
  }, [room.id, showChat, activeTab]);

  // Listen to call_rooms updates (to detect when the peer ends the call)
  useEffect(() => {
    const peerName = isTutor ? room.student?.name : room.tutor?.name;

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
          const updatedRoom = payload.new;
          if (updatedRoom.status === "ended" || updatedRoom.status === "rejected") {
            if (endingByMeRef.current) {
              setCallExitNotice({
                title: "Consulta finalizada",
                message: "Cerraste la llamada. Te llevamos de vuelta a Tutorías.",
                actionLabel: "Volver ahora",
              });
            } else {
              setCallExitNotice({
                title: "Consulta finalizada",
                message: `${peerName || "La otra persona"} terminó la llamada. Te llevamos de vuelta a Tutorías.`,
                actionLabel: "Volver a Tutorías",
              });
            }
            scheduleReturnToTutorias();
          }
        }
      )
      .subscribe();

    return () => {
      unsubscribeRealtimeChannel(channel);
    };
  }, [isTutor, room.id, room.student?.name, room.tutor?.name, router]);

  // Call duration stopwatch timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
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
      title: "Cerrando consulta",
      message: "Estamos finalizando la llamada y guardando el cierre.",
      actionLabel: "Volver ahora",
    });

    const res = await endCall(room.id);
    if (!res.success) {
      endingByMeRef.current = false;
      setCallExitNotice({
        title: "No pudimos cerrar la llamada",
        message: res.error || "Intentá finalizarla de nuevo en unos segundos.",
        actionLabel: "Entendido",
      });
      return;
    }

    setCallExitNotice({
      title: "Consulta finalizada",
      message: "Cerraste la llamada. Te llevamos de vuelta a Tutorías.",
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

  const clampPreviewPosition = (x: number, y: number): PreviewPosition => {
    const stage = videoStageRef.current;
    const preview = localPreviewRef.current;
    const padding = 16;

    if (!stage || !preview) {
      return { x, y };
    }

    const maxX = Math.max(padding, stage.clientWidth - preview.offsetWidth - padding);
    const maxY = Math.max(padding, stage.clientHeight - preview.offsetHeight - padding);

    return {
      x: Math.min(Math.max(x, padding), maxX),
      y: Math.min(Math.max(y, padding), maxY),
    };
  };

  const handlePreviewPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest("button")) return;

    const stage = videoStageRef.current;
    const preview = localPreviewRef.current;
    if (!stage || !preview) return;

    const stageRect = stage.getBoundingClientRect();
    const previewRect = preview.getBoundingClientRect();
    const offsetX = event.clientX - previewRect.left;
    const offsetY = event.clientY - previewRect.top;

    preview.setPointerCapture(event.pointerId);
    setLocalPreviewPosition({
      x: previewRect.left - stageRect.left,
      y: previewRect.top - stageRect.top,
    });

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextX = moveEvent.clientX - stageRect.left - offsetX;
      const nextY = moveEvent.clientY - stageRect.top - offsetY;
      setLocalPreviewPosition(clampPreviewPosition(nextX, nextY));
    };

    const stopDragging = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging, { once: true });
    window.addEventListener("pointercancel", stopDragging, { once: true });
  };

  // Format stopwatch counter nicely
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Peer identification details
  const peerUser = isTutor ? room.student : room.tutor;
  const peerRoleLabel = isTutor ? "Estudiante" : "Tutor experto";
  const peerInitials = `${peerUser?.name?.[0] || ""}${peerUser?.last_name?.[0] || ""}`.toUpperCase();
  const hasRemoteMedia = Boolean(remoteStream);
  const mediaInfoTitle = mediaMode === "chat-only" ? "Modo chat" : "Modo sin cámara";

  return (
    <div className="flex-grow flex flex-col min-h-0 relative">
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
      
      {/* Top Banner Status */}
      <div className="bg-glass px-6 py-3 rounded-xl border border-border/20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg z-10 mb-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0"></div>
          <div>
            <h2 className="font-heading font-black text-sm text-foreground flex items-center gap-1.5 leading-none">
              Consulta en Vivo
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            </h2>
            <span className="text-xs text-muted-foreground mt-0.5 block leading-none">
              Materia: <span className="text-accent font-semibold">{room.subject?.name || "General"}</span>
            </span>
          </div>
        </div>

        {/* Call Timer Counter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-muted/40 px-3.5 py-1.5 rounded-full border border-border/10 text-xs font-mono font-bold shrink-0">
            <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>{formatTime(callDuration)}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            {peerUser?.avatar_url ? (
              <Image
                src={peerUser.avatar_url}
                alt={peerUser.name}
                width={28}
                height={28}
                className="rounded-full object-cover border border-accent/20"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[10px] font-bold font-mono">
                {peerInitials}
              </div>
            )}
            <div className="text-left leading-none">
              <span className="text-xs font-bold block">{peerUser?.name} {peerUser?.last_name}</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">{peerRoleLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main viewport area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 mb-6">
        
        {/* Videos Area (col-span-2) */}
        <div
          ref={videoStageRef}
          className="lg:col-span-2 relative flex flex-col justify-between min-h-[350px] bg-obsidian rounded-xl overflow-hidden border border-border/20 shadow-2xl"
        >
          
          {/* Main Remote Video */}
          <div className="absolute inset-0 z-0 bg-neutral-900/50 flex items-center justify-center">
            {hasRemoteMedia ? (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={remoteHasVideo ? "w-full h-full object-cover" : "absolute w-px h-px opacity-0 pointer-events-none"}
                />
                {!remoteHasVideo && (
                  <div className="text-center space-y-6 p-8 relative">
                    <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-accent/10 border border-accent/30 animate-ping opacity-60"></div>
                      <div className="absolute -inset-2 rounded-full bg-accent/5 border border-accent/20 animate-pulse"></div>
                      <div className="w-20 h-20 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-heading font-black text-2xl shadow-xl shadow-accent/10 relative z-10">
                        {peerInitials || "UC"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-heading font-bold text-lg text-foreground tracking-tight">
                        {remoteHasAudio ? "Audio Conectado" : "Llamada Establecida"}
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                        {remoteHasAudio
                          ? `${peerUser?.name} está en la tutoría (micrófono activo).`
                          : `Esperando el flujo de video y audio de ${peerUser?.name}.`}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Loading/connecting placeholder
              <div className="text-center space-y-6 p-8 relative">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-accent/10 border border-accent/20 animate-pulse"></div>
                  <Loader2 className="w-10 h-10 animate-spin text-accent relative z-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-heading font-bold text-lg text-foreground tracking-tight">
                    Conectando sala de tutoría...
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    {mediaMode === "chat-only"
                      ? `Podés usar el chat y compartir apuntes mientras esperamos a ${peerUser?.name}.`
                      : `Estableciendo videollamada directa P2P de forma segura con ${peerUser?.name}.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Floating Local Video (PiP) */}
          <div
            ref={localPreviewRef}
            onPointerDown={handlePreviewPointerDown}
            className={`absolute z-10 overflow-hidden border border-accent/30 shadow-2xl bg-black/95 select-none touch-none transition-[width,height,border-radius,box-shadow] duration-200 ${
              isLocalPreviewCollapsed
                ? "w-14 h-14 rounded-full cursor-grab active:cursor-grabbing"
                : "w-40 h-24 sm:w-52 sm:h-32 rounded-xl cursor-grab active:cursor-grabbing"
            }`}
            style={
              localPreviewPosition
                ? { left: localPreviewPosition.x, top: localPreviewPosition.y }
                : { top: 16, right: 16 }
            }
          >
            {isLocalPreviewCollapsed ? (
              <button
                type="button"
                onClick={() => setIsLocalPreviewCollapsed(false)}
                className="w-full h-full flex items-center justify-center text-accent hover:bg-accent/10 transition-colors focus:outline-none"
                title="Expandir vista propia"
                aria-label="Expandir vista propia"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            ) : (
              <>
                {localStream && !isCameraOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 text-muted-foreground bg-muted/20">
                    <User className="w-6 h-6 opacity-35" />
                    <span className="text-[10px] mt-1 font-semibold">Vos</span>
                  </div>
                )}

                <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
                  <div className="h-7 px-2 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center text-white/75">
                    <GripHorizontal className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLocalPreviewCollapsed(true)}
                    className="w-7 h-7 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-black/70 flex items-center justify-center transition-colors focus:outline-none"
                    title="Contraer vista propia"
                    aria-label="Contraer vista propia"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Direct-WebRTC connection failure */}
          {connectionError && (
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-destructive/95 text-white border border-destructive/20 p-3.5 rounded-xl flex items-start gap-3 shadow-2xl backdrop-blur-md">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 animate-bounce text-amber-300" />
              <div className="flex-1 min-w-0">
                <h5 className="font-heading font-black text-sm text-amber-100 uppercase tracking-wider leading-none">
                  Falla de Conexión
                </h5>
                <p className="text-xs text-destructive-foreground/90 mt-1 leading-relaxed">
                  {connectionError}
                </p>
              </div>
            </div>
          )}

          {/* Non-blocking local media info */}
          {visibleMediaInfo && !connectionError && (
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-card/90 text-foreground border border-border/40 p-3.5 rounded-xl flex items-start gap-3 shadow-2xl backdrop-blur-md animate-fade-in">
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

          {/* Peer connection state status dot */}
          <div className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/10 flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-wider shadow-md">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                connectionState === "connected"
                  ? "bg-emerald-500"
                  : connectionState === "connecting"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-red-500"
              }`}
            ></div>
            <span>RTC: {connectionState === "connected" ? "Conectado" : connectionState}</span>
          </div>

        </div>

        {/* Collapsible side panel (col-span-1) */}
        {showChat && (
          <div className="flex flex-col h-full min-h-[350px] lg:col-span-1 min-w-0">
            {/* Navigation Tabs */}
            <div className="flex border-b border-border/20 mb-3 bg-glass p-1 rounded-xl gap-1 shrink-0 border">
              <button
                onClick={() => handleTabChange("chat")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
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
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "resources"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Apuntes</span>
              </button>
            </div>

            {/* Tab view contents */}
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

      {/* Control bar bottom center */}
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
