"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";
import { CallMessageExtended } from "@/actions/consultas";

interface CallChatProps {
  messages: CallMessageExtended[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
}

export default function CallChat({
  messages,
  currentUserId,
  onSendMessage,
}: CallChatProps) {
  const [inputText, setInputText] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  return (
    <div className="flex flex-col h-full bg-glass border border-border/20 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-border/20 flex items-center gap-2 bg-muted/20">
        <MessageSquare className="w-4 h-4 text-accent" />
        <h4 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">
          Chat de la consulta
        </h4>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
            <p className="text-sm">¡Saludá! Escribí un mensaje para empezar a chatear.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const senderName = isMe
              ? "Vos"
              : `${msg.sender?.name ?? "Compañero/a"} ${msg.sender?.last_name ?? ""}`.trim();
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  isMe ? "self-end items-end" : "self-start items-start"
                }`}
              >
                <span className="text-[10px] text-muted-foreground mb-1 px-1 font-semibold">
                  {senderName}
                </span>
                <div
                  className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isMe
                      ? "bg-accent text-accent-foreground rounded-tr-none"
                      : "bg-muted/70 text-foreground border border-border/20 rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input controls */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-border/20 bg-muted/20 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribí un mensaje..."
          className="flex-1 bg-background border border-border/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-accent hover:bg-accent/90 text-accent-foreground p-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
