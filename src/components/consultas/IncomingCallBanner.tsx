"use client";

import { Check, X, PhoneCall } from "lucide-react";

interface IncomingCallBannerProps {
  studentName: string;
  subjectName: string;
  onAccept: () => void;
  onReject: () => void;
  isResponding: boolean;
}

export default function IncomingCallBanner({
  studentName,
  subjectName,
  onAccept,
  onReject,
  isResponding,
}: IncomingCallBannerProps) {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg bg-glass dark:border-accent/30 rounded-xl p-4 shadow-2xl border border-accent/20 animate-fade-in backdrop-blur-xl">
      <div className="flex items-center gap-4">
        {/* Animated Phone Call Icon */}
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent shrink-0 relative">
          <span className="absolute inset-0 rounded-full bg-accent/30 animate-ping opacity-75"></span>
          <PhoneCall className="w-6 h-6 animate-pulse" />
        </div>

        {/* Text information */}
        <div className="flex-1 min-w-0">
          <h4 className="font-heading font-bold text-base text-foreground truncate">
            ¡Consulta entrante!
          </h4>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
            <span className="font-semibold text-foreground">{studentName}</span> necesita una mano en{" "}
            <span className="font-semibold text-accent">{subjectName}</span>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Reject */}
          <button
            onClick={onReject}
            disabled={isResponding}
            className="p-2.5 rounded-full hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors focus:outline-none disabled:opacity-50"
            title="Rechazar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Accept */}
          <button
            onClick={onAccept}
            disabled={isResponding}
            className="bg-accent hover:bg-accent/90 text-accent-foreground p-2.5 rounded-full shadow-md shadow-accent/15 transition-all hover:scale-105 focus:outline-none disabled:opacity-50 flex items-center justify-center"
            title="Aceptar"
          >
            <Check className="w-5 h-5 font-bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
