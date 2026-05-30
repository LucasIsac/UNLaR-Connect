"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Download, AlertCircle, Loader2, Plus, X, Upload, CloudUpload, ArrowLeft } from "lucide-react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { DbDocument } from "@/types/database";
import { uploadResource } from "@/actions/recursos";

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
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Preview State
  const [selectedDocPreview, setSelectedDocPreview] = useState<DbDocument | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isImageFile = (doc: DbDocument) => {
    const typeLower = (doc.document_type || "").toLowerCase();
    if (typeLower.includes("image") || typeLower.includes("imagen")) return true;
    const cleanUrl = doc.storage_url.split("?")[0].split("#")[0];
    const extension = cleanUrl.split(".").pop()?.toLowerCase();
    return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension || "");
  };

  const isPdfFile = (doc: DbDocument) => {
    const typeLower = (doc.document_type || "").toLowerCase();
    if (typeLower.includes("pdf")) return true;
    const cleanUrl = doc.storage_url.split("?")[0].split("#")[0];
    const extension = cleanUrl.split(".").pop()?.toLowerCase();
    return extension === "pdf";
  };

  const loadDocuments = async () => {
    try {
      let query = supabase.from("documents").select("*");
      if (subjectId) {
        query = query.eq("subject_id", subjectId);
      } else {
        query = query.is("subject_id", null);
      }
      
      const { data, error } = await query.order("uploaded_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error("Error loading resources:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadDocuments();
  }, [subjectId]);

  const handleDownloadFile = async (doc: DbDocument) => {
    try {
      const response = await fetch(doc.storage_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.title;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading file:", err);
      // Fallback: open in new tab
      window.open(doc.storage_url, "_blank");
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadFile) {
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
      formData.append("category", subjectName || ""); // If null, passes empty string so DB registers subject_id as null
      formData.append("thematicAxis", "General");
      formData.append("type", "Apunte de Teoría");
      formData.append("description", "Material cargado durante la videollamada.");

      const res = await uploadResource(formData);

      if (!res.success) {
        throw new Error(res.error || "No se pudo registrar el apunte.");
      }

      // 3. Success!
      setUploadTitle("");
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
    <div className="flex flex-col h-full bg-glass border border-border/20 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl max-w-full">
      {/* Header */}
      <div className="p-4 border-b border-border/20 flex items-center justify-between bg-muted/20 gap-2 shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-accent shrink-0" />
          <h4 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider truncate">
            {subjectName ? `Apuntes: ${subjectName}` : "Apuntes de la Clase"}
          </h4>
        </div>
        <button
          onClick={() => {
            setShowUploadForm(!showUploadForm);
            setUploadError(null);
          }}
          className="p-1.5 rounded-lg bg-accent/15 border border-accent/20 text-accent hover:bg-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1 text-xs font-bold shrink-0"
          title="Cargar nuevo apunte"
        >
          {showUploadForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{showUploadForm ? "Cancelar" : "Cargar"}</span>
        </button>
      </div>

      {/* Upload Form Section */}
      {showUploadForm && (
        <form onSubmit={handleUploadSubmit} className="p-4 border-b border-border/20 bg-muted/10 space-y-3.5 shrink-0 select-none w-full max-w-full">
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
                <span className="block text-xs font-medium text-foreground truncate max-w-full px-2">
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
              <span className="break-words max-w-[200px]">{uploadError}</span>
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
        ) : documents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <FileText className="w-8 h-8 opacity-20 mb-2" />
            <p className="text-sm">No encontramos apuntes cargados todavía.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDocPreview(doc)}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/10 hover:border-accent/30 hover:bg-accent/5 transition-all group min-w-0 cursor-pointer"
                title="Ver vista previa"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 text-left flex-1">
                    <h5 className="font-medium text-sm text-foreground truncate max-w-full">
                      {doc.title}
                    </h5>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      {doc.document_type}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadFile(doc);
                  }}
                  className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-accent hover:bg-accent/15 transition-colors shrink-0 ml-2"
                  title="Descargar archivo"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal Overlay (rendered outside the sidebar context using React Portal) */}
      {selectedDocPreview && isMounted && createPortal(
        <div 
          onClick={() => setSelectedDocPreview(null)}
          className="fixed inset-0 z-[999] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 select-none animate-fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl h-[85vh] rounded-2xl border border-border/40 bg-glass shadow-2xl flex flex-col overflow-hidden cursor-default"
          >
            {/* Modal Header */}
            <div className="p-4 md:px-6 border-b border-border/20 flex items-center justify-between bg-muted/20 shrink-0 select-none">
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                <button
                  onClick={() => setSelectedDocPreview(null)}
                  className="p-2 -ml-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0"
                  title="Volver atrás"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 hidden sm:flex">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-sm md:text-base text-foreground truncate">
                    {selectedDocPreview.title}
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                    {selectedDocPreview.document_type || "Documento"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => handleDownloadFile(selectedDocPreview)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-accent/15"
                  title="Descargar archivo"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Descargar</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-obsidian/40 relative min-h-0">
              {isImageFile(selectedDocPreview) ? (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto bg-black/40 backdrop-blur-sm">
                  <img
                    src={selectedDocPreview.storage_url}
                    alt={selectedDocPreview.title}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg border border-border/20 shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                  />
                </div>
              ) : isPdfFile(selectedDocPreview) ? (
                <iframe
                  src={`${selectedDocPreview.storage_url}#view=FitH`}
                  title={`Preview de ${selectedDocPreview.title}`}
                  className="w-full h-full border-none rounded-b-2xl bg-white"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-6 bg-black/25">
                  <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent animate-pulse">
                    <FileText className="w-10 h-10" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h4 className="font-heading font-bold text-lg text-foreground">
                      Previsualización no disponible
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Este tipo de archivo no se puede previsualizar en el navegador, pero podés descargarlo para verlo en tu dispositivo.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadFile(selectedDocPreview)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-accent/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar archivo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
