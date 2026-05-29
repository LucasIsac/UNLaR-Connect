'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bot,
  Send,
  Paperclip,
  FileText,
  Presentation,
  PlusCircle,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { sendChatMessageAction } from '@/actions/chat';

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

        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
        const contentStr = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : line;

        const parsedElements = parseInlineMarkdown(contentStr);

        if (isBullet) {
          return (
            <ul key={i} className="list-disc pl-5 my-1 space-y-1">
              <li className="text-foreground/90">{parsedElements}</li>
            </ul>
          );
        }

        return <p key={i} className="text-foreground/95">{parsedElements}</p>;
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
  const [feedback, setFeedback] = useState<Record<number, 'like' | 'dislike' | null>>({});
  const [copiedStates, setCopiedStates] = useState<Record<number, boolean>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

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
  }, [messages, isTyping]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      // Map the messages state array to ChatMessage type (matching the Server Action types)
      const chatMessages = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const reply = await sendChatMessageAction(chatMessages);
      
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
    <div className="flex h-[calc(100vh-4rem)] -mt-8 -mx-6 md:-ml-[240px] md:-mr-[320px] -mb-6 md:-mb-8">
      {/* Main chat column */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
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
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-2">
                      {msg.sources.map((src, j) => (
                        <div
                          key={j}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-card/60 border border-border/30 rounded-md text-xs"
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
              <button className="p-2 text-muted-foreground hover:text-accent transition-colors rounded-full shrink-0 hover:bg-card/40">
                <Paperclip className="w-5 h-5" />
              </button>
              <textarea
                className="flex-1 bg-transparent border-none focus:ring-0 text-foreground resize-none py-1.5 px-2 max-h-28 overflow-y-auto text-sm placeholder-muted-foreground/50 scrollbar-none"
                placeholder="Preguntale a tus apuntes..."
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="w-9 h-9 bg-accent text-accent-foreground rounded-full hover:bg-accent/90 transition-colors flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.2)] shrink-0 disabled:opacity-40"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
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
