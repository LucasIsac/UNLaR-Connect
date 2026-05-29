"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, MessageSquare } from "lucide-react";
import { fetchSessionMessages, sendSessionMessage, SessionMessage } from "@/actions/tutoring-scheduled";
import { createClient } from "@/lib/supabase/client";

interface SessionChatModalProps {
  sessionId: string;
  currentUserId: string;
  sessionTitle: string;
  peerName: string;
  onClose: () => void;
}

export default function SessionChatModal({
  sessionId,
  currentUserId,
  sessionTitle,
  peerName,
  onClose,
}: SessionChatModalProps) {
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadMessages();

    // Subscribe to new messages for this session
    const channel = supabase
      .channel(`session_chat_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tutoring_session_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          // New message inserted
          const newMsgId = payload.new.id;
          // We need sender info, so we fetch the complete message with joined data
          // A quick hack is to re-fetch all, but it's better to fetch just this one
          const { data } = await supabase
            .from("tutoring_session_messages")
            .select(`
              id, session_id, sender_id, content, created_at,
              sender:users!sender_id(name, last_name, avatar_url)
            `)
            .eq("id", newMsgId)
            .single();

          if (data) {
            const formattedMsg: SessionMessage = {
              id: data.id,
              session_id: data.session_id,
              sender_id: data.sender_id,
              content: data.content,
              created_at: data.created_at,
              sender: data.sender ? (Array.isArray(data.sender) ? data.sender[0] : data.sender) : undefined,
            };
            
            setMessages((prev) => {
              // Avoid duplicates if we sent it and it was already added optimistically
              if (prev.some((m) => m.id === formattedMsg.id)) return prev;
              return [...prev, formattedMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    setLoading(true);
    const result = await fetchSessionMessages(sessionId);
    if (result.success && result.data) {
      setMessages(result.data);
    }
    setLoading(false);
  }

  async function handleSend() {
    if (!inputText.trim()) return;
    setSending(true);
    const textToSend = inputText;
    setInputText("");

    const result = await sendSessionMessage(sessionId, textToSend);
    if (result.success && result.data) {
      // Optimistic add (the realtime channel might also catch it, we handle duplicates there)
      setMessages((prev) => {
        if (prev.some((m) => m.id === result.data!.id)) return prev;
        return [...prev, result.data!];
      });
    } else {
      // Restore on fail
      setInputText(textToSend);
      console.error("Failed to send:", result.error);
    }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-glass border border-border/40 rounded-xl max-w-lg w-full shadow-2xl flex flex-col h-[80vh] overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/20 bg-muted/10">
          <div>
            <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-accent" />
              Chat: {peerName}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{sessionTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
              <MessageSquare className="w-12 h-12 mb-3" />
              <p className="text-sm">No hay mensajes todavía.</p>
              <p className="text-xs mt-1">¡Escribí algo para comenzar!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              const time = new Date(msg.created_at).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? "bg-accent text-accent-foreground rounded-tr-sm"
                        : "bg-muted/30 text-foreground border border-border/20 rounded-tl-sm"
                    }`}
                  >
                    {!isMine && msg.sender?.name && (
                      <p className="text-[10px] font-bold opacity-70 mb-1">
                        {msg.sender.name}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1.5 text-right ${
                        isMine ? "text-accent-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {time}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-4 border-t border-border/20 bg-background/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escribí un mensaje..."
              className="flex-1 bg-muted/20 border border-border/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={handleSend}
              disabled={sending || !inputText.trim()}
              className="w-12 h-12 shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-accent/20"
            >
              {sending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
