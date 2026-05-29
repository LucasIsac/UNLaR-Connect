"use client";

import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare } from "lucide-react";

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  showChat: boolean;
  onToggleChat: () => void;
  unreadCount?: number;
}

export default function CallControls({
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onEndCall,
  showChat,
  onToggleChat,
  unreadCount = 0,
}: CallControlsProps) {
  return (
    <div className="bg-glass border border-border/20 px-6 py-4 rounded-xl flex items-center justify-center gap-4 max-w-md w-full shadow-2xl backdrop-blur-xl">
      {/* Mute Button */}
      <button
        onClick={onToggleMute}
        className={`p-3 rounded-full border transition-all hover:scale-105 focus:outline-none ${
          isMuted
            ? "bg-destructive/20 border-destructive/30 text-destructive"
            : "bg-muted/50 border-border/40 text-foreground hover:bg-muted/80"
        }`}
        title={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {/* Camera Button */}
      <button
        onClick={onToggleCamera}
        className={`p-3 rounded-full border transition-all hover:scale-105 focus:outline-none ${
          isCameraOff
            ? "bg-destructive/20 border-destructive/30 text-destructive"
            : "bg-muted/50 border-border/40 text-foreground hover:bg-muted/80"
        }`}
        title={isCameraOff ? "Activar cámara" : "Apagar cámara"}
      >
        {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
      </button>

      {/* Chat Toggle Button */}
      <button
        onClick={onToggleChat}
        className={`p-3 rounded-full border transition-all hover:scale-105 focus:outline-none relative ${
          showChat
            ? "bg-accent/20 border-accent/30 text-accent"
            : "bg-muted/50 border-border/40 text-foreground hover:bg-muted/80"
        }`}
        title="Abrir chat"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* End Call Button */}
      <button
        onClick={onEndCall}
        className="p-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 transition-all hover:scale-105 focus:outline-none"
        title="Finalizar llamada"
      >
        <PhoneOff className="w-5 h-5 fill-white" />
      </button>
    </div>
  );
}
