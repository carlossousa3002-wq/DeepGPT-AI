import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  Cpu,
  Send,
  Sparkles,
  Trash2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Message } from "./types";


// Custom code-block and simple markdown tokenizer to render technical responses elegantly
interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1.5 border-b border-slate-800/80 text-slate-400 text-[11px] font-semibold">
        <span className="uppercase tracking-wider text-cyan-500">{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors py-0.5 px-1.5 rounded hover:bg-slate-800"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copiado!" : "Copiar"}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-slate-300 whitespace-pre scrollbar-thin">
        <code>{code}</code>
      </div>
    </div>
  );
}

function FormattedResponse({ text }: { text: string }) {
  if (!text) return null;

  // Split content by code blocks: ```lang ... ```
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 leading-relaxed text-sm font-sans text-slate-200">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "";
          const code = match ? match[2] : part.slice(3, -3);
          return (
            <div key={index}>
              <CodeBlock language={lang} code={code.trim()} />
            </div>
          );
        } else {
          // Render basic line breaks, bullet points and bold tags
          const lines = part.split("\n");
          return (
            <div key={index} className="space-y-1.5">
              {lines.map((line, lineIdx) => {
                // Check if bullet point
                const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
                // Highlight bold text (**bold**)
                const boldRegex = /\*\*([\s\S]*?)\*\*/g;
                const formattedLine = line.replace(boldRegex, "<strong>$1</strong>");

                if (isBullet) {
                  const cleanedLine = line.trim().replace(/^[-*]\s+/, "");
                  return (
                    <ul key={lineIdx} className="list-disc pl-5 text-slate-300">
                      <li
                        dangerouslySetInnerHTML={{
                          __html: cleanedLine.replace(boldRegex, '<strong class="text-cyan-400">$1</strong>'),
                        }}
                      />
                    </ul>
                  );
                }

                if (line.trim() === "") {
                  return <div key={lineIdx} className="h-2" />;
                }

                return (
                  <p
                    key={lineIdx}
                    className="text-slate-200"
                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                  />
                );
              })}
            </div>
          );
        }
      })}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom on new messages or thinking status
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  const handlePresetPrompt = (promptText: string) => {
    setInput(promptText);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    if (isThinking) return;

    const userMessageText = input;
    
    // Clear inputs immediately
    setInput("");
    setError(null);

    // Append user message to thread
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessageText,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      // Build conversation history format for API
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessageText,
          history: historyPayload,
          autoLearn: false,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Ocorreu um erro ao processar a resposta.");
      }

      const data = await res.json();

      // Append DeepGPT response
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: data.answer,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro de rede ao conectar com o modelo.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans bg-grid-cyber antialiased selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden w-full">
      {/* Glow effect headers */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* MAIN CHAT WINDOW: ESTILO CHATGPT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950/20 backdrop-blur-sm relative">
        
        {/* Top Header inside Chat */}
        <header className="border-b border-slate-900/80 bg-slate-950/80 backdrop-blur-md px-4 py-3 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold tracking-wider text-slate-100 font-mono">
              DEEPGPT NEURAL 3.5B
            </span>
            <span className="px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold rounded font-mono animate-pulse">
              CHAT ATIVO
            </span>
          </div>

          <div>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-red-950/30 border border-slate-800 hover:border-red-900/40 rounded-lg text-xs font-semibold text-slate-300 hover:text-red-400 transition-all duration-200"
                title="Limpar Conversa"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Conversa</span>
              </button>
            )}
          </div>
        </header>

        {/* Chat Feed Box: ChatGPT-style central container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
            
            {messages.length === 0 ? (
              /* Beautiful Simplified Welcome View */
              <div className="py-12 flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 p-4 bg-gradient-to-br from-cyan-950/40 to-slate-950 border border-cyan-500/20 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                >
                  <Cpu className="w-10 h-10 text-cyan-400" />
                </motion.div>

                <h1 className="text-2xl font-bold text-slate-100 font-mono tracking-wide uppercase">
                  DEEPGPT NEURAL 3.5B
                </h1>
                <p className="text-sm text-slate-400 mt-2 font-sans max-w-md">
                  Como posso ajudar você hoje? Digite sua pergunta para uma resposta rápida e inteligente.
                </p>

                {/* ChatGPT-style grid options */}
                <div className="mt-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                  <button
                    onClick={() =>
                      handlePresetPrompt(
                        "Explique o que é inteligência artificial de forma extremamente objetiva e prática."
                      )
                    }
                    className="p-4 bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 rounded-xl text-left text-xs font-mono text-slate-300 transition-all duration-200"
                  >
                    <div className="font-bold text-cyan-400 mb-1">🤖 Explicação Prática</div>
                    <span className="text-[11px] text-slate-400 block">Aprenda conceitos complexos de forma descomplicada.</span>
                  </button>

                  <button
                    onClick={() =>
                      handlePresetPrompt(
                        "Escreva uma função simples em React com TypeScript para gerenciar um histórico de chat."
                      )
                    }
                    className="p-4 bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 rounded-xl text-left text-xs font-mono text-slate-300 transition-all duration-200"
                  >
                    <div className="font-bold text-cyan-400 mb-1">⚡ Exemplos de Código</div>
                    <span className="text-[11px] text-slate-400 block">Escreva, corrija ou entenda códigos rapidamente.</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Message Bubbles - Elegant central listing */
              <div className="space-y-6">
                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-1`}
                    >
                      {/* Name header */}
                      <span className="text-[10px] font-mono text-slate-500 px-1">
                        {isUser ? "Você" : "DeepGPT Neural 3.5B"} • {msg.timestamp}
                      </span>

                      {/* Bubble with spacious paddings */}
                      <div
                        className={`w-full rounded-2xl p-4 md:p-5 shadow-sm ${
                          isUser
                            ? "bg-slate-900/60 border border-slate-800 text-slate-100"
                            : "bg-slate-950/80 border border-slate-900 text-slate-200"
                        }`}
                      >
                        {/* Main message text */}
                        <FormattedResponse text={msg.content} />
                      </div>
                    </div>
                  );
                })}

                {/* Loading / Thinking Box */}
                {isThinking && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 px-1">
                      DeepGPT • Pensando...
                    </span>
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/40 border border-slate-900 rounded-xl max-w-max text-xs text-slate-400">
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Analisando consulta...</span>
                    </div>
                  </div>
                )}

                {/* Error Box */}
                {error && (
                  <div className="flex items-start gap-2.5 p-4 bg-red-950/20 border border-red-500/20 text-red-300 rounded-xl text-xs font-mono">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold uppercase tracking-wider">Falha de Canal</p>
                      <p>{error}</p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM INPUT AREA: ESTILO CHATGPT */}
        <div className="border-t border-slate-900 bg-slate-950/80 px-4 py-4 shrink-0">
          <div className="max-w-3xl mx-auto space-y-2.5">
            
            <form onSubmit={handleSend} className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  isThinking
                    ? "DeepGPT processando resposta..."
                    : "Pergunte ao DeepGPT... (Pressione Enter para enviar)"
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 resize-none font-sans leading-relaxed min-h-[48px] max-h-36 scrollbar-none"
                rows={1}
                disabled={isThinking}
              />

              <button
                type="submit"
                disabled={isThinking || !input.trim()}
                className={`absolute right-2.5 top-2.5 p-2 rounded-lg transition-all duration-300 ${
                  input.trim()
                    ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)] hover:scale-105"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                {isThinking ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            <div className="text-[10px] text-slate-500 font-mono text-center">
              <span>DeepGPT pode cometer erros de raciocínio. Considere verificar informações importantes.</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
