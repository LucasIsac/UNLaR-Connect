"use client";

import { useEffect, useState } from "react";
import { FileText, Download, AlertCircle, Loader2 } from "lucide-react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { DbDocument } from "@/types/database";

interface ResourcesPanelProps {
  subjectId: number | null;
}

export default function ResourcesPanel({ subjectId }: ResourcesPanelProps) {
  const [documents, setDocuments] = useState<DbDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    if (!subjectId) {
      setLoading(false);
      return;
    }

    async function loadDocuments() {
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("subject_id", subjectId)
          .order("uploaded_at", { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } catch (err) {
        console.error("Error loading resources:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, [subjectId]);

  return (
    <div className="flex flex-col h-full bg-glass border border-border/20 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-border/20 flex items-center gap-2 bg-muted/20">
        <FileText className="w-4 h-4 text-accent" />
        <h4 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">
          Apuntes de la Materia
        </h4>
      </div>

      {/* Resources list */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-0">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground mt-2">Buscando apuntes...</p>
          </div>
        ) : !subjectId ? (
          <div className="flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <AlertCircle className="w-8 h-8 opacity-20 mb-2" />
            <p className="text-sm">Sin materia asignada para esta consulta.</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <FileText className="w-8 h-8 opacity-20 mb-2" />
            <p className="text-sm">No encontramos apuntes cargados para esta materia todavía.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.storage_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/10 hover:border-accent/30 hover:bg-accent/5 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h5 className="font-medium text-sm text-foreground truncate max-w-[180px]">
                      {doc.title}
                    </h5>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      {doc.document_type}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-accent group-hover:bg-accent/15 transition-colors shrink-0">
                  <Download className="w-4 h-4" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
