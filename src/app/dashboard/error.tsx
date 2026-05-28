"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { AlertTriangle, RefreshCw } from "lucide-react";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <DashboardLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-glass rounded-3xl border border-destructive/20 p-8 text-center shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mb-5">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h1 className="font-heading text-2xl font-black text-cream-bone mb-2">
            No pudimos cargar esta sección
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Algo falló al buscar tus datos. Probá de nuevo y, si sigue pasando, revisamos el detalle en la consola.
          </p>

          {error.message && (
            <p className="text-[11px] text-muted-foreground/80 bg-card/40 border border-border/20 rounded-xl p-3 mb-6 font-mono break-words">
              {error.message}
            </p>
          )}

          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-accent text-accent-foreground text-sm font-bold hover:bg-accent/90 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
