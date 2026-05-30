'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bot,
  Send,
  FileText,
  Presentation,
  PlusCircle,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Filter,
  X,
} from 'lucide-react';
import { sendChatMessageAction } from '@/actions/chat';
import { fetchResources, ResourceExtended } from '@/actions/recursos';
import { ingestDocumentAction } from '@/actions/ingest';
import { Select } from '@/components/ui/Select';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  sources?: { file: string; page: string }[];
};

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 border border-border/30 rounded-xl overflow-hidden bg-card/40 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/20 bg-muted/40 text-xs text-muted-foreground select-none">
        <span className="font-mono lowercase">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-accent" />
              <span className="text-accent font-semibold">¡Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar bg-black/20">
        <pre className="font-mono text-xs text-cream-bone leading-relaxed whitespace-pre">{code}</pre>
      </div>
    </div>
  );
}

function parseInlineMarkdown(text: string) {
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-cream-bone">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="bg-muted px-1.5 py-0.5 rounded text-accent font-mono text-xs border border-border/30">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function RichText({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Check for Markdown headings
        if (trimmed.startsWith('# ')) {
          return <h1 key={i} className="text-xl font-bold text-cream-bone mt-4 mb-2 select-text">{parseInlineMarkdown(trimmed.slice(2))}</h1>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={i} className="text-lg font-bold text-cream-bone mt-3.5 mb-1.5 select-text">{parseInlineMarkdown(trimmed.slice(3))}</h2>;
        }
        if (trimmed.startsWith('### ')) {
          return <h3 key={i} className="text-base font-bold text-cream-bone mt-3 mb-1 select-text">{parseInlineMarkdown(trimmed.slice(4))}</h3>;
        }
        if (trimmed.startsWith('#### ')) {
          return <h4 key={i} className="text-sm font-bold text-cream-bone mt-2.5 mb-1 select-text">{parseInlineMarkdown(trimmed.slice(5))}</h4>;
        }

        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
        const contentStr = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : line;

        const parsedElements = parseInlineMarkdown(contentStr);

        if (isBullet) {
          return (
            <ul key={i} className="list-disc pl-5 my-1 space-y-1">
              <li className="text-foreground/90 select-text">{parsedElements}</li>
            </ul>
          );
        }

        return <p key={i} className="text-foreground/95 select-text">{parsedElements}</p>;
      })}
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const parts = content.split(/(```[a-z]*\n[\s\S]*?\n```)/g);

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const match = part.match(/```([a-z]*)\n([\s\S]*?)\n```/);
          const lang = match ? match[1] : '';
          const code = match ? match[2] : part.slice(3, -3);

          return <CodeBlock key={index} language={lang} code={code} />;
        } else {
          return <RichText key={index} text={part} />;
        }
      })}
    </div>
  );
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'assistant',
    content:
      '¡Hola! Soy tu Asistente UNLaR. Podés chatear conmigo de forma general o seleccionar cualquiera de tus apuntes en la barra lateral para hacer consultas específicas. ¿Qué te gustaría repasar hoy?',
  },
];

export default function AsistenteClient() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // RAG / Documents states
  const [documents, setDocuments] = useState<ResourceExtended[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>(undefined);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatusText, setIngestStatusText] = useState("");

  // Context filtering states
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const [feedback, setFeedback] = useState<Record<number, 'like' | 'dislike' | null>>({});
  const [copiedStates, setCopiedStates] = useState<Record<number, boolean>>({});
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load document list from resources bank on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const data = await fetchResources();
        setDocuments(data);
      } catch (err) {
        console.error("Failed to load documents for RAG context:", err);
      } finally {
        setIsLoadingDocs(false);
      }
    };
    loadDocuments();
  }, []);

  // Compute dynamic lists for filters
  const uniqueSubjects = Array.from(new Set(documents.map(d => d.category).filter(Boolean)));
  const uniqueTopics = Array.from(new Set(documents.map(d => d.thematicAxis).filter(Boolean)));

  const subjectOptions = [
    { value: "all", label: "Todas las materias" },
    ...uniqueSubjects.map(sub => ({ value: sub, label: sub }))
  ];

  const topicOptions = [
    { value: "all", label: "Todos los ejes" },
    ...uniqueTopics.map(top => ({ value: top, label: top }))
  ];

  const typeOptions = [
    { value: "all", label: "Todos los formatos" },
    { value: "pdf", label: "PDF (.pdf)" },
    { value: "text", label: "Texto/MD (.txt, .md)" }
  ];

  // Filter documents in real time based on active states
  const filteredDocuments = documents.filter(doc => {
    const matchSubject = filterSubject === "all" || doc.category === filterSubject;
    const matchTopic = filterTopic === "all" || doc.thematicAxis === filterTopic;
    
    let matchType = true;
    if (filterType !== "all") {
      if (filterType === "pdf") {
        matchType = doc.document_type.toLowerCase() === "pdf";
      } else if (filterType === "text") {
        matchType = doc.document_type.toLowerCase() === "txt" || doc.document_type.toLowerCase() === "md";
      }
    }
    
    return matchSubject && matchTopic && matchType;
  });

  const handleFeedback = (idx: number, type: 'like' | 'dislike') => {
    setFeedback((prev) => ({
      ...prev,
      [idx]: prev[idx] === type ? null : type,
    }));
  };

  const handleCopyMessage = (idx: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedStates((prev) => ({ ...prev, [idx]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [idx]: false }));
    }, 2000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isIngesting]);

  // Handle active document selection and self-healing vector ingestion if needed
  const handleSelectDoc = async (docId: string) => {
    if (selectedDocId === docId) {
      setSelectedDocId(undefined);
      return;
    }

    setSelectedDocId(docId);
    setIsIngesting(true);
    setIngestStatusText("Analizando apunte y preparando embeddings semánticos. Bancanos unos segundos...");

    try {
      const res = await ingestDocumentAction(docId);
      if (!res.success) {
        console.error("RAG Ingest Action Failed:", res.message);
      }
    } catch (err) {
      console.error("Unexpected error during RAG doc ingestion:", err);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping || isIngesting) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      // Map state array to secure backend format
      const chatMessages = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Trigger completions passing the query messages, active context document ID, and active filters
      const reply = await sendChatMessageAction(
        chatMessages, 
        selectedDocId,
        { subject: filterSubject, topic: filterTopic, type: filterType }
      );
      
      const aiMessage: Message = { role: 'assistant', content: reply };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Error sending message to Groq:", err);
      const errorMessage: Message = { 
        role: 'assistant', 
        content: "Che, disculpame, pero surgió un problema de conexión con el asistente de IA. Probá mandando tu mensaje otra vez." 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-6.5rem)] w-full gap-6">
      {/* Main chat column - Flat layout */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        
        {/* RAG Context Selection Header (Highly Responsive & Mobile Friendly) */}
        <div className="py-3 border-b border-border/20 flex items-center justify-between text-xs shrink-0 select-none mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedDocId ? 'bg-accent animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-muted-foreground/30'}`} />
            <span className="text-muted-foreground font-medium whitespace-nowrap hidden sm:inline">Modo de consulta:</span>
            <span className="font-semibold text-foreground truncate">
              {selectedDocId 
                ? `Apunte: "${documents.find(d => d.id === selectedDocId)?.title || 'Procesando...'}"` 
                : 'General (Todos los apuntes)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedDocId && (
              <button 
                onClick={() => setSelectedDocId(undefined)}
                className="text-accent hover:underline font-medium shrink-0 ml-1 mr-2"
              >
                Desactivar
              </button>
            )}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent font-bold text-xs hover:bg-accent/15 transition-all focus:outline-none"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apuntes ({filteredDocuments.length})</span>
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-4 sm:px-6 space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex w-full max-w-3xl mx-auto ${
                msg.role === 'user' ? 'justify-end' : 'justify-start flex-col items-start'
              }`}
            >
              {msg.role === 'user' ? (
                <div className="px-5 py-3 rounded-full bg-muted text-foreground border border-border text-sm max-w-2xl leading-relaxed">
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              ) : (
                <div className="w-full text-foreground text-sm leading-relaxed py-3">
                  <MarkdownRenderer content={msg.content} />
                  {/* Actions Row */}
                  <div className="flex items-center gap-2.5 mt-2.5 text-muted-foreground/60 select-none">
                    <button
                      onClick={() => handleFeedback(i, 'like')}
                      className={`p-1.5 rounded-lg hover:bg-muted/30 transition-colors ${
                        feedback[i] === 'like' ? 'text-accent drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'hover:text-foreground'
                      }`}
                      title="Me gusta"
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${feedback[i] === 'like' ? 'fill-accent' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleFeedback(i, 'dislike')}
                      className={`p-1.5 rounded-lg hover:bg-muted/30 transition-colors ${
                        feedback[i] === 'dislike' ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.4)]' : 'hover:text-foreground'
                      }`}
                      title="No me gusta"
                    >
                      <ThumbsDown className={`w-3.5 h-3.5 ${feedback[i] === 'dislike' ? 'fill-red-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleCopyMessage(i, msg.content)}
                      className="p-1.5 rounded-lg hover:bg-muted/30 hover:text-foreground transition-colors flex items-center gap-1 text-[11px]"
                      title="Copiar respuesta"
                    >
                      {copiedStates[i] ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-accent" />
                          <span className="text-accent font-semibold">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* RAG Loading Animation Block */}
          {isIngesting && (
            <div className="flex justify-start w-full max-w-3xl mx-auto py-4 px-5 bg-accent/5 border border-accent/20 rounded-2xl animate-pulse">
              <div className="flex gap-3.5 items-center w-full">
                <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
                <div className="text-xs text-foreground/90 font-medium">
                  {ingestStatusText}
                </div>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start w-full max-w-3xl mx-auto py-3">
              <div className="flex gap-1.5 items-center pl-1 h-6 select-none">
                <span className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 bg-transparent shrink-0">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent/15 to-secondary/10 rounded-full blur opacity-25 group-focus-within:opacity-40 transition duration-500 pointer-events-none" />
            <div className="relative bg-muted/95 border border-border rounded-full shadow-lg flex items-center p-1.5 pl-3.5 pr-2 focus-within:border-accent/50 transition-colors">
              <textarea
                className="flex-1 bg-transparent border-none focus:ring-0 text-foreground resize-none py-1.5 px-2 max-h-28 overflow-y-auto text-sm placeholder-muted-foreground/50 scrollbar-none"
                placeholder={selectedDocId ? "Hacé una pregunta sobre este apunte..." : "Preguntale a tus apuntes..."}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isIngesting}
              />
              <button
                className="w-9 h-9 bg-accent text-accent-foreground rounded-full hover:bg-accent/90 transition-colors flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.2)] shrink-0 disabled:opacity-40"
                onClick={handleSend}
                disabled={!input.trim() || isTyping || isIngesting}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
            <p className="text-center mt-2 text-[11px] text-muted-foreground/50 select-none">
              La IA puede cometer errores. Verificá la información importante.
            </p>
          </div>
        </div>
      </div>

      {/* Right context sidebar - Flat layout separated by thin vertical divider */}
      <aside className="w-72 border-l border-border/40 pl-6 hidden lg:flex flex-col shrink-0 h-full">
        <div className="pb-3 border-b border-border/20 flex items-center justify-between">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Contexto del Chat
          </h3>
          {selectedDocId && (
            <button 
              onClick={() => setSelectedDocId(undefined)}
              className="text-[10px] text-accent font-semibold hover:underline"
            >
              Desactivar
            </button>
          )}
        </div>

        {/* Dynamic Context Filters Bar */}
        <div className="py-3 border-b border-border/20 space-y-2 select-none text-[10px] text-muted-foreground shrink-0">
          <div className="flex items-center gap-1 mb-1 font-semibold text-foreground uppercase tracking-wider text-[9px] text-muted-foreground/80">
            <Filter className="w-3 h-3" />
            <span>Filtros de Contexto</span>
          </div>

          <div className="flex flex-col gap-1">
            <span>Materia:</span>
            <Select 
              value={filterSubject}
              onChange={(val) => setFilterSubject(val as string)}
              options={subjectOptions}
              className="bg-card/65 border border-border/40 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span>Eje Temático:</span>
            <Select 
              value={filterTopic}
              onChange={(val) => setFilterTopic(val as string)}
              options={topicOptions}
              className="bg-card/65 border border-border/40 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span>Formato:</span>
            <Select 
              value={filterType}
              onChange={(val) => setFilterType(val as string)}
              options={typeOptions}
              className="bg-card/65 border border-border/40 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between w-full"
            />
          </div>
        </div>

        {/* Scrollable Document List */}
        <div className="py-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
          {isLoadingDocs ? (
            <div className="text-center py-8 text-xs text-muted-foreground/60 select-none">
              Cargando apuntes del servidor...
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground/50 select-none">
              No hay apuntes que coincidan con los filtros.
            </div>
          ) : (
            filteredDocuments.map((doc) => {
              const active = selectedDocId === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc.id)}
                  className={`bg-muted/40 border rounded-lg p-3.5 relative overflow-hidden transition-colors cursor-pointer ${
                    active
                      ? 'border-accent/25 hover:border-accent/50 bg-muted/95'
                      : 'border-border/50 hover:border-border opacity-70 hover:opacity-100'
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-0 w-1 h-full bg-accent" />
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded bg-card flex items-center justify-center shrink-0 text-secondary">
                      {doc.document_type === 'pdf' ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        <Presentation className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-foreground line-clamp-1">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Materia: {doc.category}
                      </p>
                    </div>
                  </div>
                  {(doc.thematicAxis || doc.document_type) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {doc.thematicAxis && doc.thematicAxis !== "General" && (
                        <span className="px-1.5 py-0.5 bg-card/60 text-muted-foreground text-[9px] rounded border border-border/40 truncate max-w-[120px]">
                          {doc.thematicAxis}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 bg-card/60 text-muted-foreground text-[9px] rounded border border-border/40 uppercase">
                        {doc.document_type}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}

          <button 
            onClick={() => window.location.href = "/recursos"}
            className="w-full py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors flex flex-col items-center justify-center gap-1.5 text-center mt-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="text-[11px] font-semibold">Subir apunte a UNLaR</span>
          </button>
        </div>
      </aside>

      {/* Mobile Context Sidebar Drawer */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-80 max-w-[90%] h-full bg-background/60 backdrop-blur-2xl border-l border-border/40 dark:border-white/5 p-6 flex flex-col z-10 shadow-2xl"
            >
              {/* Close Button inside Drawer */}
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="pb-3 border-b border-border/20 flex items-center justify-between mt-2 select-none shrink-0">
                <h3 className="text-xs font-black text-cream-bone uppercase tracking-wider">
                  Contexto del Chat
                </h3>
                {selectedDocId && (
                  <button 
                    onClick={() => {
                      setSelectedDocId(undefined);
                      setIsMobileSidebarOpen(false);
                    }}
                    className="text-[10px] text-accent font-semibold hover:underline"
                  >
                    Desactivar
                  </button>
                )}
              </div>

              {/* Dynamic Context Filters Bar inside Drawer */}
              <div className="py-4 border-b border-border/20 space-y-2 select-none text-[10px] text-muted-foreground shrink-0">
                <div className="flex items-center gap-1 mb-1 font-semibold text-foreground uppercase tracking-wider text-[9px] text-muted-foreground/80">
                  <Filter className="w-3 h-3" />
                  <span>Filtros de Contexto</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span>Materia:</span>
                  <Select 
                    value={filterSubject}
                    onChange={(val) => setFilterSubject(val as string)}
                    options={subjectOptions}
                    className="bg-card/65 border border-border/40 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span>Eje Temático:</span>
                  <Select 
                    value={filterTopic}
                    onChange={(val) => setFilterTopic(val as string)}
                    options={topicOptions}
                    className="bg-card/65 border border-border/40 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span>Formato:</span>
                  <Select 
                    value={filterType}
                    onChange={(val) => setFilterType(val as string)}
                    options={typeOptions}
                    className="bg-card/65 border border-border/40 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between w-full"
                  />
                </div>
              </div>

              {/* Scrollable Document List inside Drawer */}
              <div className="py-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                {isLoadingDocs ? (
                  <div className="text-center py-8 text-xs text-muted-foreground/60 select-none">
                    Cargando apuntes...
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground/50 select-none">
                    No hay apuntes.
                  </div>
                ) : (
                  filteredDocuments.map((doc) => {
                    const active = selectedDocId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          handleSelectDoc(doc.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`bg-muted/40 border rounded-lg p-3.5 relative overflow-hidden transition-colors cursor-pointer ${
                          active
                            ? 'border-accent/25 hover:border-accent/50 bg-muted/95'
                            : 'border-border/50 hover:border-border opacity-70 hover:opacity-100'
                        }`}
                      >
                        {active && (
                          <div className="absolute left-0 top-0 w-1 h-full bg-accent" />
                        )}
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded bg-card flex items-center justify-center shrink-0 text-secondary">
                            {doc.document_type === 'pdf' ? (
                              <FileText className="w-4 h-4" />
                            ) : (
                              <Presentation className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-foreground line-clamp-1">
                              {doc.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {doc.category}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                <button 
                  onClick={() => window.location.href = "/recursos"}
                  className="w-full py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors flex flex-col items-center justify-center gap-1.5 text-center mt-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="text-[11px] font-semibold">Subir apunte</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
