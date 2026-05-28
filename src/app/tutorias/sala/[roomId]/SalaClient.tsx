"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
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
  Clock,
  Sparkles
} from "lucide-react";

interface SalaClientProps {
  room: CallRoomExtended;
  isTutor: boolean;
  currentUserId: string;
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

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<DbCallMessage[]>([]);
  const [showChat, setShowChat] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "resources">("chat");
  const [unreadCount, setUnreadCount] = useState(0);

  // Call timer state
  const [callDuration, setCallDuration] = useState(0);

  // Initialize WebRTC Peer Connection and Streams
  const {
    localStream,
    remoteStream,
    connectionState,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
  } = useWebRTC({
    roomId: room.id,
    isTutor,
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
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

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
      channel.unsubscribe();
    };
  }, [room.id, showChat, activeTab]);

  // Listen to call_rooms updates (to detect when the peer ends the call)
  useEffect(() => {
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
            alert("La llamada ha sido finalizada por el otro usuario.");
            router.push("/tutorias");
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [room.id]);

  // Call duration stopwatch timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (content: string) => {
    await sendCallMessage(room.id, content);
  };

  const handleEndCall = async () => {
    await endCall(room.id);
    router.push("/tutorias");
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

  return (
    <div className="flex-grow flex flex-col min-h-0 relative">
      
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
              <img
                src={peerUser.avatar_url}
                alt={peerUser.name}
                className="w-7 h-7 rounded-full object-cover border border-accent/20"
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
        <div className="lg:col-span-2 relative flex flex-col justify-between min-h-[350px] bg-obsidian rounded-xl overflow-hidden border border-border/20 shadow-2xl">
          
          {/* Main Remote Video */}
          <div className="absolute inset-0 z-0 bg-neutral-900/50 flex items-center justify-center">
            {connectionState === "connected" && remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              // Loading/connecting placeholder
              <div className="text-center space-y-4 p-6">
                <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto" />
                <div>
                  <h4 className="font-heading font-bold text-base text-foreground">
                    Estableciendo conexión...
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed mt-1">
                    Conectando de forma directa y segura con {peerUser?.name}.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Floating Local Video (PiP) */}
          <div className="absolute top-4 right-4 z-10 w-28 sm:w-36 h-36 sm:h-48 rounded-xl overflow-hidden border border-accent/30 shadow-2xl bg-black">
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
                <span className="text-[10px] mt-1 font-semibold">Tú</span>
              </div>
            )}
          </div>

          {/* Direct-WebRTC fallback/warning banner */}
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
