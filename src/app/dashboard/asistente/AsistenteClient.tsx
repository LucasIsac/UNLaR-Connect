'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bot,
  Send,
  Paperclip,
  BookOpen,
  List,
  HelpCircle,
  FileText,
  Presentation,
  PlusCircle,
} from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  sources?: { file: string; page: string }[];
};

const MOCK_DOCS = [
  {
    name: 'Apunte_Unidad_3_Memoria.pdf',
    pages: 45,
    added: 'hoy',
    tags: ['SO II', 'Teoría'],
    active: true,
    type: 'pdf' as const,
  },
  {
    name: 'Clase_04_Concurrencia.pptx',
    pages: 28,
    added: 'ayer',
    tags: ['SO II', 'Práctica'],
    active: false,
    type: 'pptx' as const,
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'assistant',
    content:
      'Hola. Soy tu Asistente UNLaR. He analizado los documentos de "Gestión de Memoria" y "Concurrencia". ¿Qué te gustaría repasar hoy?',
  },
];

export default function AsistenteClient() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = trimmed.toLowerCase();
      let reply: string;
      let sources: { file: string; page: string }[] | undefined;

      if (lower.includes('paginación') || lower.includes('segmentación')) {
        reply =
          'Según los apuntes de la cátedra, la diferencia principal radica en cómo se divide lógicamente la memoria y cómo el sistema operativo maneja esas divisiones.\n\n• Paginación: Divide la memoria física en bloques de tamaño fijo (marcos) y la memoria lógica en bloques del mismo tamaño (páginas). Es transparente para el programador.\n\n• Segmentación: Divide la memoria en bloques de tamaño variable (segmentos) que corresponden a unidades lógicas del programa (como la pila, el código, los datos). Es visible para el programador.';
        sources = [
          { file: 'Apunte_Unidad_3_Memoria.pdf', page: 'Pág. 14' },
        ];
      } else if (lower.includes('concurr') || lower.includes('hilo')) {
        reply =
          'La concurrencia permite que múltiples tareas se ejecuten simultáneamente en un mismo programa. En los apuntes se distingue entre:\n\n• Paralelismo real: múltiples núcleos de CPU ejecutando instrucciones al mismo tiempo.\n• Concurrencia lógica: un solo núcleo alterna entre tareas tan rápido que parece que corren en paralelo.\n\nLos hilos (threads) son la unidad básica de concurrencia dentro de un proceso.';
        sources = [
          { file: 'Clase_04_Concurrencia.pptx', page: 'Slide 8' },
        ];
      } else {
        reply =
          'Buena pregunta. Déjame revisar los documentos cargados en el contexto para darte la mejor respuesta posible. ¿Podrías darme más detalles sobre el tema específico que te interesa?';
      }

      const aiMessage: Message = { role: 'assistant', content: reply, sources };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -mt-8 -mx-6 md:-mx-80 -mb-6 md:-mb-8">
      {/* Main chat column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Document context header */}
        <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-card/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-secondary shrink-0" />
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Sistemas Operativos II
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground text-xs mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span>2 Documentos Activos en Contexto</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-card border border-border rounded-lg text-foreground hover:bg-accent/10 transition-colors flex items-center gap-2 text-xs font-semibold">
              <List className="w-4 h-4" />
              Resumir Contexto
            </button>
            <button className="px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent rounded-lg hover:bg-accent/20 transition-colors flex items-center gap-2 text-xs font-semibold">
              <HelpCircle className="w-4 h-4" />
              Generar Quizz
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex w-full max-w-3xl mx-auto ${
                msg.role === 'user' ? 'justify-end' : 'justify-start gap-3'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
              )}
              <div
                className={`px-5 py-3.5 rounded-2xl max-w-2xl leading-relaxed text-sm ${
                  msg.role === 'user'
                    ? 'bg-muted text-foreground rounded-tr-sm border border-border'
                    : 'bg-glass backdrop-blur-xl border-l-2 border-accent rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.sources.map((src, j) => (
                      <div
                        key={j}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border rounded-md text-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-secondary" />
                        <span className="text-muted-foreground">{src.file}</span>
                        <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {src.page}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start w-full max-w-3xl mx-auto gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <div className="px-5 py-3.5 rounded-2xl rounded-tl-sm bg-glass backdrop-blur-xl border-l-2 border-accent">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-border bg-gradient-to-t from-background to-transparent shrink-0">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent/15 to-secondary/10 rounded-2xl blur opacity-25 group-focus-within:opacity-40 transition duration-500 pointer-events-none" />
            <div className="relative bg-muted border border-border rounded-xl shadow-lg flex items-end p-1.5 focus-within:border-accent/50 transition-colors">
              <button className="p-2.5 text-muted-foreground hover:text-accent transition-colors rounded-lg shrink-0">
                <Paperclip className="w-5 h-5" />
              </button>
              <textarea
                className="flex-1 bg-transparent border-none focus:ring-0 text-foreground resize-none py-2.5 px-2 max-h-28 overflow-y-auto text-sm placeholder-muted-foreground/50"
                placeholder="Pregúntale a tus apuntes..."
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="p-2.5 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center ml-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)] shrink-0 disabled:opacity-40"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center mt-2 text-[11px] text-muted-foreground/50">
              El Asistente de IA puede cometer errores. Verificá la información con tus materiales oficiales.
            </p>
          </div>
        </div>
      </div>

      {/* Right context sidebar */}
      <aside className="w-72 border-l border-border bg-card/50 hidden lg:flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Contexto Actual
          </h3>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
          {MOCK_DOCS.map((doc, idx) => (
            <div
              key={idx}
              className={`bg-muted border rounded-lg p-3.5 relative overflow-hidden transition-colors cursor-pointer ${
                doc.active
                  ? 'border-accent/25 hover:border-accent/50'
                  : 'border-border/50 hover:border-border opacity-70'
              }`}
            >
              {doc.active && (
                <div className="absolute left-0 top-0 w-1 h-full bg-accent" />
              )}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-card flex items-center justify-center shrink-0 text-secondary">
                  {doc.type === 'pdf' ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <Presentation className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-foreground line-clamp-1">
                    {doc.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {doc.pages} páginas · Añadido {doc.added}
                  </p>
                </div>
              </div>
              {doc.tags && (
                <div className="mt-2.5 flex gap-1.5">
                  {doc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-card text-muted-foreground text-[10px] rounded border border-border/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button className="w-full py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors flex flex-col items-center justify-center gap-1.5">
            <PlusCircle className="w-4 h-4" />
            <span className="text-[11px] font-semibold">Añadir documento al contexto</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
