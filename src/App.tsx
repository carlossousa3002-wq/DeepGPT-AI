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
  Download,
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

  const handleDownloadStandaloneHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeepGPT Neural 3.5B - Standalone AI Chat</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/lucide@0.344.0/dist/umd/lucide.min.js"></script>
  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
    .bg-grid-cyber {
      background-size: 40px 40px;
      background-image: 
        linear-gradient(to right, rgba(6, 182, 212, 0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(6, 182, 212, 0.04) 1px, transparent 1px);
    }
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #020617;
    }
    ::-webkit-scrollbar-thumb {
      background: #1e293b;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #06b6d4;
    }
  </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 flex flex-col bg-grid-cyber antialiased overflow-hidden">
  
  <!-- Glow effect headers -->
  <div class="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
  <div class="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

  <!-- Main Chat Structure -->
  <div class="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950/20 backdrop-blur-sm relative">
    
    <!-- Top Header -->
    <header class="border-b border-slate-900/80 bg-slate-950/80 backdrop-blur-md px-4 py-3 flex items-center justify-between z-10 shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-sm font-extrabold tracking-wider text-slate-100 font-mono">
          DEEPGPT NEURAL 3.5B
        </span>
        <span class="px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold rounded font-mono animate-pulse">
          STANDALONE OFFLINE
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button onclick="toggleSettingsModal()" class="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-colors" title="Configurar API Key">
          <i data-lucide="settings" class="w-3.5 h-3.5"></i>
          <span>API Key</span>
        </button>
        <button onclick="clearChat()" class="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:text-red-400 transition-colors" title="Limpar Conversa">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          <span>Limpar</span>
        </button>
      </div>
    </header>

    <!-- Chat Messages Box -->
    <div id="chat-feed" class="flex-1 overflow-y-auto">
      <div id="messages-container" class="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
        
        <!-- Welcome view by default -->
        <div id="welcome-view" class="py-12 flex flex-col items-center text-center">
          <div class="mb-6 p-4 bg-gradient-to-br from-cyan-950/40 to-slate-950 border border-cyan-500/20 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <i data-lucide="cpu" class="w-10 h-10 text-cyan-400"></i>
          </div>
          <h1 class="text-2xl font-bold text-slate-100 font-mono tracking-wide uppercase">
            DEEPGPT NEURAL 3.5B
          </h1>
          <p class="text-sm text-slate-400 mt-2 font-sans max-w-md">
            Esta é a versão autônoma e completa que roda diretamente no seu navegador ou GitHub Pages! Configurando sua própria API Key, você se comunica diretamente com a IA da Google.
          </p>

          <!-- API Alert Indicator -->
          <div id="key-badge-container" class="mt-4">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-950/40 border border-yellow-500/20 text-yellow-300 text-xs rounded-lg font-mono">
              <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-yellow-400"></i>
              <span>API Key do Gemini pendente de configuração</span>
            </span>
          </div>

          <!-- Quick Actions Grid -->
          <div class="mt-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            <button onclick="setPresetPrompt('Explique de forma prática o que é computação quântica e quais suas aplicações no mundo real.')" class="p-4 bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 rounded-xl text-left text-xs font-mono text-slate-300 transition-all duration-200">
              <div class="font-bold text-cyan-400 mb-1">⚛️ Computação Quântica</div>
              <span class="text-[11px] text-slate-400 block">Entenda conceitos complexos de forma extremamente simples.</span>
            </button>
            <button onclick="setPresetPrompt('Crie uma página HTML moderna e estilizada com Tailwind contendo um belo cronômetro progressivo.')" class="p-4 bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 rounded-xl text-left text-xs font-mono text-slate-300 transition-all duration-200">
              <div class="font-bold text-cyan-400 mb-1">💻 Programação e Código</div>
              <span class="text-[11px] text-slate-400 block">Escreva ou analise trechos de código em diversas linguagens.</span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Input Form Area -->
    <div class="border-t border-slate-900 bg-slate-950/80 px-4 py-4 shrink-0">
      <div class="max-w-3xl mx-auto space-y-2.5">
        
        <form id="chat-form" onsubmit="handleFormSubmit(event)" class="relative">
          <textarea
            id="prompt-input"
            onkeydown="handleTextareaKeyDown(event)"
            placeholder="Pergunte ao DeepGPT... (Configure sua API Key primeiro)"
            class="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 resize-none font-sans leading-relaxed min-h-[48px] max-h-36"
            rows="1"
          ></textarea>
          
          <button
            type="submit"
            id="send-button"
            class="absolute right-2.5 top-2.5 p-2 rounded-lg bg-slate-800 text-slate-500 cursor-not-allowed transition-all duration-300"
            disabled
          >
            <i data-lucide="send" class="w-4 h-4"></i>
          </button>
        </form>

        <div class="text-[10px] text-slate-500 font-mono text-center">
          <span>Esta página roda inteiramente no cliente. Nenhuma informação é enviada a terceiros, exceto a Google Gemini API.</span>
        </div>

      </div>
    </div>

  </div>

  <!-- Settings Modal overlay -->
  <div id="settings-modal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
      <button onclick="toggleSettingsModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
      
      <div class="flex items-center gap-2.5 mb-4">
        <i data-lucide="key" class="w-5 h-5 text-cyan-400"></i>
        <h2 class="text-base font-extrabold tracking-wider text-slate-100 font-mono uppercase">Configuração de API Key</h2>
      </div>
      
      <p class="text-xs text-slate-400 mb-4 leading-relaxed font-sans">
        Para usar este chat de forma totalmente independente, você precisa de uma API Key do Google Gemini (gratuita). Obtenha em <a href="https://aistudio.google.com" target="_blank" class="text-cyan-400 hover:underline">ai.studio.google.com</a>.
      </p>

      <div class="space-y-4">
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Sua Gemini API Key</label>
          <input
            id="key-input"
            type="password"
            placeholder="Cole sua API Key aqui (AIzaSy...)"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
          >
        </div>

        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Modelo Recomendado</label>
          <select
            id="model-select"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="gemini-2.5-flash">gemini-2.5-flash (Mais Rápido e Inteligente)</option>
            <option value="gemini-1.5-flash">gemini-1.5-flash (Clássico)</option>
          </select>
        </div>

        <button onclick="saveSettings()" class="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-all duration-200">
          Salvar Configurações
        </button>
      </div>
    </div>
  </div>

  <script>
    // App state
    let messages = [];
    let isThinking = false;
    let apiKey = localStorage.getItem('GEMINI_API_KEY') || '';
    let selectedModel = localStorage.getItem('GEMINI_MODEL') || 'gemini-2.5-flash';

    // Initialize UI elements
    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      updateKeyBadgeAndButton();
      
      // Load input key value if exists
      if (apiKey) {
        document.getElementById('key-input').value = apiKey;
      }
      document.getElementById('model-select').value = selectedModel;
      
      // Auto resize input textarea
      const promptInput = document.getElementById('prompt-input');
      promptInput.addEventListener('input', () => {
        promptInput.style.height = 'auto';
        promptInput.style.height = (promptInput.scrollHeight) + 'px';
      });
    });

    function updateKeyBadgeAndButton() {
      const container = document.getElementById('key-badge-container');
      const input = document.getElementById('prompt-input');
      const sendBtn = document.getElementById('send-button');

      if (!container) return;

      if (apiKey) {
        container.innerHTML = \`
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg font-mono">
            <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>Chave de API configurada e ativa</span>
          </span>
        \`;
        input.placeholder = "Pergunte ao DeepGPT... (Pressione Enter para enviar)";
        sendBtn.disabled = false;
        sendBtn.classList.remove('bg-slate-800', 'text-slate-500', 'cursor-not-allowed');
        sendBtn.classList.add('bg-cyan-500', 'text-slate-950', 'hover:scale-105');
      } else {
        container.innerHTML = \`
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-950/40 border border-yellow-500/20 text-yellow-300 text-xs rounded-lg font-mono">
            <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-yellow-400"></i>
            <span>API Key do Gemini pendente de configuração</span>
          </span>
        \`;
        input.placeholder = "Configure sua API Key no painel superior para habilitar o chat.";
        sendBtn.disabled = true;
        sendBtn.classList.add('bg-slate-800', 'text-slate-500', 'cursor-not-allowed');
        sendBtn.classList.remove('bg-cyan-500', 'text-slate-950', 'hover:scale-105');
      }
      lucide.createIcons();
    }

    function toggleSettingsModal() {
      const modal = document.getElementById('settings-modal');
      modal.classList.toggle('hidden');
    }

    function saveSettings() {
      const keyVal = document.getElementById('key-input').value.trim();
      const modelVal = document.getElementById('model-select').value;

      if (!keyVal) {
        alert('Por favor, digite uma API Key válida.');
        return;
      }

      localStorage.setItem('GEMINI_API_KEY', keyVal);
      localStorage.setItem('GEMINI_MODEL', modelVal);
      apiKey = keyVal;
      selectedModel = modelVal;

      updateKeyBadgeAndButton();
      toggleSettingsModal();
    }

    function setPresetPrompt(text) {
      const input = document.getElementById('prompt-input');
      input.value = text;
      input.style.height = 'auto';
      input.style.height = (input.scrollHeight) + 'px';
      input.focus();
    }

    function clearChat() {
      messages = [];
      const container = document.getElementById('messages-container');
      container.innerHTML = \`
        <div id="welcome-view" class="py-12 flex flex-col items-center text-center">
          <div class="mb-6 p-4 bg-gradient-to-br from-cyan-950/40 to-slate-950 border border-cyan-500/20 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <i data-lucide="cpu" class="w-10 h-10 text-cyan-400"></i>
          </div>
          <h1 class="text-2xl font-bold text-slate-100 font-mono tracking-wide uppercase">
            DEEPGPT NEURAL 3.5B
          </h1>
          <p class="text-sm text-slate-400 mt-2 font-sans max-w-md">
            Esta é a versão autônoma e completa que roda diretamente no seu navegador ou GitHub Pages! Configurando sua própria API Key, você se comunica diretamente com a IA da Google.
          </p>
          <div id="key-badge-container" class="mt-4"></div>
        </div>
      \`;
      updateKeyBadgeAndButton();
    }

    function handleTextareaKeyDown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleFormSubmit(e);
      }
    }

    async function handleFormSubmit(e) {
      if (e) e.preventDefault();
      const input = document.getElementById('prompt-input');
      const text = input.value.trim();

      if (!text || isThinking || !apiKey) return;

      isThinking = true;
      input.value = '';
      input.style.height = 'auto';

      // Hide welcome view if visible
      const welcome = document.getElementById('welcome-view');
      if (welcome) welcome.remove();

      // Add user message to UI
      const userMsg = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) };
      messages.push(userMsg);
      renderMessage(userMsg);

      // Render Thinking state
      const thinkingId = 'thinking-' + Date.now();
      renderThinkingIndicator(thinkingId);

      try {
        const payload = {
          contents: messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })),
          systemInstruction: {
            parts: [{ text: "Você é o 'DeepGPT Neural 3.5B', respondendo de forma clara, prestativa, altamente formatada e bonita em Português." }]
          }
        };

        const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${selectedModel}:generateContent?key=\${apiKey}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error?.message || "Falha na requisição à API do Gemini.");
        }

        const data = await response.json();
        const modelText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui obter uma resposta.";

        // Remove thinking indicator
        document.getElementById(thinkingId)?.remove();

        const modelMsg = { id: (Date.now()+1).toString(), role: 'model', content: modelText, timestamp: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) };
        messages.push(modelMsg);
        renderMessage(modelMsg);

      } catch (err) {
        document.getElementById(thinkingId)?.remove();
        renderErrorMessage(err.message || "Erro de comunicação ao enviar a mensagem.");
      } finally {
        isThinking = false;
      }
    }

    function renderMessage(msg) {
      const container = document.getElementById('messages-container');
      const isUser = msg.role === 'user';
      
      const bubble = document.createElement('div');
      bubble.className = \`flex flex-col \${isUser ? 'items-end' : 'items-start'} gap-1\`;
      
      const formattedText = formatMarkdown(msg.content);

      bubble.innerHTML = \`
        <span class="text-[10px] font-mono text-slate-500 px-1">
          \${isUser ? 'Você' : 'DeepGPT Neural 3.5B'} • \${msg.timestamp}
        </span>
        <div class="w-full rounded-2xl p-4 md:p-5 shadow-sm \${isUser ? 'bg-slate-900/60 border border-slate-800 text-slate-100' : 'bg-slate-950/80 border border-slate-900 text-slate-200'}">
          \${formattedText}
        </div>
      \`;

      container.appendChild(bubble);
      scrollToBottom();
      lucide.createIcons();
    }

    function renderThinkingIndicator(id) {
      const container = document.getElementById('messages-container');
      const bubble = document.createElement('div');
      bubble.id = id;
      bubble.className = "flex flex-col items-start gap-1";
      bubble.innerHTML = \`
        <span class="text-[10px] font-mono text-slate-500 px-1">
          DeepGPT • Pensando...
        </span>
        <div class="flex items-center gap-2 px-4 py-3 bg-slate-900/40 border border-slate-900 rounded-xl max-w-max text-xs text-slate-400">
          <i data-lucide="refresh-cw" class="w-4 h-4 animate-spin text-cyan-400"></i>
          <span>Processando resposta da inteligência...</span>
        </div>
      \`;
      container.appendChild(bubble);
      scrollToBottom();
      lucide.createIcons();
    }

    function renderErrorMessage(text) {
      const container = document.getElementById('messages-container');
      const bubble = document.createElement('div');
      bubble.className = "flex items-start gap-2.5 p-4 bg-red-950/20 border border-red-500/20 text-red-300 rounded-xl text-xs font-mono w-full";
      bubble.innerHTML = \`
        <i data-lucide="alert-circle" class="w-4 h-4 text-red-400 shrink-0 mt-0.5"></i>
        <div>
          <p class="font-bold uppercase tracking-wider">Falha de Conexão</p>
          <p>\${text}</p>
        </div>
      \`;
      container.appendChild(bubble);
      scrollToBottom();
      lucide.createIcons();
    }

    function formatMarkdown(text) {
      if (!text) return '';
      let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Code blocks
      html = html.replace(/\`\`\`(\\w*)\\n([\\s\\S]*?)\`\`\`/g, function(match, lang, code) {
        const codeId = 'code-' + Math.random().toString(36).substr(2, 9);
        return '<div class="my-4 border border-slate-900 rounded-lg overflow-hidden bg-slate-950 font-mono text-xs">' +
          '<div class="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider">' +
            '<span>' + (lang || 'code') + '</span>' +
            '<button onclick="copyToClipboard(\\'' + codeId + '\\', this)" class="flex items-center gap-1 hover:text-cyan-400 transition-colors">' +
              '<i data-lucide="copy" class="w-3.5 h-3.5"></i>' +
              '<span>Copiar</span>' +
            '</button>' +
          '</div>' +
          '<pre class="p-4 overflow-x-auto text-slate-200"><code id="' + codeId + '">' + code.trim() + '</code></pre>' +
        '</div>';
      });

      // Inline code
      html = html.replace(/\`([^\`]+)\`/g, '<code class="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-cyan-400">$1</code>');

      // Bold
      html = html.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong class="font-bold text-slate-100">$1</strong>');

      // Paragraphs & lists
      const lines = html.split('\\n');
      const formattedLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return \`<li class="ml-4 list-disc text-slate-200 mt-1">\${trimmed.substring(2)}</li>\`;
        }
        return line ? \`<p class="text-slate-200 mb-2 leading-relaxed">\${line}</p>\` : '<div class="h-2"></div>';
      });

      return formattedLines.join('\\n');
    }

    function copyToClipboard(id, btn) {
      const codeElement = document.getElementById(id);
      if (!codeElement) return;
      const text = codeElement.textContent;
      navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = \`<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i><span class="text-emerald-400">Copiado!</span>\`;
        lucide.createIcons();
        setTimeout(() => {
          btn.innerHTML = originalText;
          lucide.createIcons();
        }, 2000);
      });
    }

    function scrollToBottom() {
      const feed = document.getElementById('chat-feed');
      feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
    }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "index.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadStandaloneHTML}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-all duration-200"
              title="Baixar index.html completo e autônomo da IA para rodar localmente ou no GitHub"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar index.html (GitHub)</span>
            </button>

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
