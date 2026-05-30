"use client";

import { useEffect, useState } from "react";
import { FileText, Download, AlertCircle, Loader2, Plus, X, Upload, CloudUpload } from "lucide-react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { DbDocument } from "@/types/database";

interface ResourcesPanelProps {
  subjectId: number | null;
  subjectName?: string;
}

export default function ResourcesPanel({ subjectId, subjectName }: ResourcesPanelProps) {
  const [documents, setDocuments] = useState<DbDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  // Upload States
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAxis, setUploadAxis] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [resolvedSubjectName, setResolvedSubjectName] = useState(subjectName || "");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (subjectName) {
      setResolvedSubjectName(subjectName);
      return;
    }
    if (!subjectId) return;

    async function loadSubject() {
      try {
        const { data } = await supabase
          .from("subjects")
          .select("name")
          .eq("id", subjectId)
          .maybeSingle();
        if (data) {
          setResolvedSubjectName(data.name);
        }
      } catch (err) {
        console.error("Error loading subject name:", err);
      }
    }

    loadSubject();
  }, [subjectId, subjectName, supabase]);

  async function loadDocuments() {
    if (!subjectId) {
      setLoading(false);
      return;
    }
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

  useEffect(() => {
    setLoading(true);
    loadDocuments();
  }, [subjectId]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadFile || !subjectId) {
      setUploadError("Por favor completá el título y seleccioná un archivo.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error("No estás autenticado/a.");
      }
      const user = authData.user;

      // 1. Upload to Supabase Storage
      const fileExt = uploadFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: storageError } = await supabase.storage
        .from('apuntes')
        .upload(filePath, uploadFile, { contentType: uploadFile.type });

      if (storageError) {
        console.error("Storage upload error:", storageError);
        throw new Error("Error al subir el archivo al almacenamiento.");
      }

      // 2. Call server action to save to DB
      const formData = new FormData();
      formData.append("title", uploadTitle.trim());
      formData.append("filePath", filePath);
      formData.append("category", resolvedSubjectName || "General");
      formData.append("thematicAxis", uploadAxis.trim() || "General");
      formData.append("type", "Apunte de Teoría");
      formData.append("description", uploadAxis.trim() ? `Material sobre ${uploadAxis.trim()}.` : `Material de la clase.`);

      const { uploadResource } = await import("@/actions/recursos");
      const res = await uploadResource(formData);

      if (!res.success) {
        throw new Error(res.error || "No se pudo registrar el apunte.");
      }

      // 3. Success!
      setUploadTitle("");
      setUploadAxis("");
      setUploadFile(null);
      setShowUploadForm(false);
      
      // Reload documents list
      await loadDocuments();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Ocurrió un error inesperado al subir.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-glass border border-border/20 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-border/20 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent" />
          <h4 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">
            Apuntes de la Materia
          </h4>
        </div>
        {subjectId && (
          <button
            onClick={() => {
              setShowUploadForm(!showUploadForm);
              setUploadError(null);
            }}
            className="p-1.5 rounded-lg bg-accent/15 border border-accent/20 text-accent hover:bg-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 text-xs font-bold shrink-0"
            title="Cargar nuevo apunte"
          >
            {showUploadForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showUploadForm ? "Cancelar" : "Cargar Apunte"}</span>
          </button>
        )}
      </div>

      {/* Upload Form Section */}
      {showUploadForm && (
        <form onSubmit={handleUploadSubmit} className="p-4 border-b border-border/20 bg-muted/10 space-y-3.5 shrink-0 select-none">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Título del Apunte *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Resumen Unidad 2"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="w-full bg-background/50 border border-border/40 rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Eje Temático (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Gestión de Memoria"
              value={uploadAxis}
              onChange={(e) => setUploadAxis(e.target.value)}
              className="w-full bg-background/50 border border-border/40 rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Archivo *
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setUploadFile(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragging 
                  ? "border-accent bg-accent/5" 
                  : uploadFile 
                  ? "border-emerald-500/50 bg-emerald-500/5" 
                  : "border-border/40 hover:border-border/70 bg-background/20"
              }`}
            >
              <input
                type="file"
                id="panel-file-upload"
                className="hidden"
                required={!uploadFile}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadFile(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="panel-file-upload" className="cursor-pointer block space-y-1">
                <CloudUpload className={`w-6 h-6 mx-auto ${uploadFile ? "text-emerald-500" : "text-muted-foreground"}`} />
                <span className="block text-xs font-medium text-foreground truncate max-w-[200px]">
                  {uploadFile ? uploadFile.name : "Seleccioná o arrastrá un archivo"}
                </span>
                <span className="block text-[9px] text-muted-foreground">
                  PDF, imágenes o documentos
                </span>
              </label>
            </div>
          </div>

          {uploadError && (
            <p className="text-xs text-destructive font-semibold bg-destructive/10 border border-destructive/25 p-2.5 rounded-xl flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{uploadError}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full h-9 rounded-xl bg-accent text-accent-foreground font-bold text-xs flex items-center justify-center gap-2 hover:bg-accent/90 active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all shadow-md shadow-accent/15"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Subiendo apunte...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Cargar a la Clase</span>
              </>
            )}
          </button>
        </form>
      )}

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
