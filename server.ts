import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { GoogleGenAI } from "@google/genai";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

// ES Module filename/dirname helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Setup JSON and body parsing with a generous size limit for file sending
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini client (server-side only)
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Resilient wrapper to handle model high demand (503) or rate limits by automatically falling back
async function generateContentWithFallback(contents: any[], config: any) {
  const models = ["gemini-3.5-flash", "gemini-2.5-flash"];
  let lastError: any = null;

  for (const model of models) {
    try {
      console.log(`DeepGPT Cognitive Link: Tentando processar via ${model}...`);
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      console.log(`DeepGPT Cognitive Link: Sucesso com modelo ${model}`);
      return response;
    } catch (error: any) {
      console.warn(`DeepGPT Warning: Falha ao utilizar modelo ${model}. Detalhes: ${error.message || error}`);
      lastError = error;
      
      // Se for erro de autenticação ou chaves, não adianta tentar outro modelo, lança imediatamente
      if (error.status === 401 || error.status === 403) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Indisponibilidade temporária nos canais neurais do Gemini.");
}

// Paths for continuous learning local database
const KNOWLEDGE_FILE = path.join(process.cwd(), "knowledge.json");

// Helper to read knowledge database
function getKnowledge() {
  try {
    if (!fs.existsSync(KNOWLEDGE_FILE)) {
      const initialKnowledge = [
        {
          id: "1",
          concept: "Modelo de Operação",
          details: "DeepGPT 3.5B está operando em modo híbrido local de alto desempenho com Thinking Neural ativo.",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          concept: "Diretiva de Raciocínio",
          details: "Priorizar raciocínio profundo passo-a-passo antes de formular respostas conclusivas.",
          createdAt: new Date().toISOString(),
        }
      ];
      fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(initialKnowledge, null, 2));
      return initialKnowledge;
    }
    const data = fs.readFileSync(KNOWLEDGE_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao ler banco de conhecimento:", err);
    return [];
  }
}

// Helper to save knowledge database
function saveKnowledge(knowledge: any[]) {
  try {
    fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(knowledge, null, 2));
  } catch (err) {
    console.error("Erro ao salvar banco de conhecimento:", err);
  }
}

// API: Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API: Retrieve continuous learnings
app.get("/api/knowledge", (req, res) => {
  const data = getKnowledge();
  res.json(data);
});

// API: Add a new learned fact manually
app.post("/api/knowledge", (req, res) => {
  const { concept, details } = req.body;
  if (!concept || !details) {
    return res.status(400).json({ error: "Conceito e detalhes são obrigatórios" });
  }

  const knowledge = getKnowledge();
  const newItem = {
    id: Date.now().toString(),
    concept: concept.trim(),
    details: details.trim(),
    createdAt: new Date().toISOString(),
  };

  knowledge.unshift(newItem); // Add to the top
  saveKnowledge(knowledge);
  res.json({ success: true, item: newItem });
});

// API: Delete a learned fact
app.delete("/api/knowledge/:id", (req, res) => {
  const { id } = req.params;
  let knowledge = getKnowledge();
  const initialLength = knowledge.length;
  knowledge = knowledge.filter((item: any) => item.id !== id);
  
  if (knowledge.length === initialLength) {
    return res.status(404).json({ error: "Item de conhecimento não encontrado" });
  }

  saveKnowledge(knowledge);
  res.json({ success: true });
});

// API: Parse File (PDF, CSV, TXT, JSON, etc.)
app.post("/api/parse-file", async (req, res) => {
  const { filename, mimeType, base64 } = req.body;

  if (!base64 || !filename) {
    return res.status(400).json({ error: "Arquivo ou nome do arquivo ausente" });
  }

  try {
    const buffer = Buffer.from(base64, "base64");
    let extractedText = "";

    if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
      // PDF Parsing
      console.log(`Iniciando extração de PDF: ${filename}`);
      const pdfData = await pdf(buffer);
      extractedText = pdfData.text || "";
    } else {
      // General Text files (txt, md, csv, json, xml, code files)
      extractedText = buffer.toString("utf-8");
    }

    if (!extractedText.trim()) {
      return res.status(422).json({ error: "O arquivo foi lido, mas nenhum texto pôde ser extraído." });
    }

    res.json({
      success: true,
      filename,
      mimeType,
      text: extractedText,
      size: buffer.length,
    });
  } catch (error: any) {
    console.error("Erro ao processar arquivo:", error);
    res.status(500).json({ error: `Erro ao processar arquivo: ${error.message}` });
  }
});

// API: Chat endpoint with simulated "Thinking" extraction and "Continuous Learning" injection
app.post("/api/chat", async (req, res) => {
  const { message, history = [], files = [], autoLearn = true } = req.body;

  if (!message) {
    return res.status(400).json({ error: "A mensagem é obrigatória." });
  }

  try {
    // 1. Fetch current continuous learning memories to inject as context
    const knowledgeList = getKnowledge();
    const formattedKnowledge = knowledgeList
      .map((k: any, idx: number) => `[Memória #${idx + 1}] Conceito: ${k.concept} - Detalhes: ${k.details}`)
      .join("\n");

    // 2. Attach any uploaded files content to the user's message
    let fileContext = "";
    if (files && files.length > 0) {
      fileContext = "\n\n--- DOCUMENTOS ANEXADOS PELO USUÁRIO ---\n";
      files.forEach((file: any) => {
        fileContext += `\n[Nome do Arquivo: ${file.name}]\n[Conteúdo Extraído]:\n${file.text}\n---------------------\n`;
      });
    }

    // 3. Format history for Gemini chat if present
    const formattedContents: any[] = [];
    
    // Add history
    history.forEach((turn: any) => {
      formattedContents.push({
        role: turn.role === "user" ? "user" : "model",
        parts: [{ text: turn.content }],
      });
    });

    // Add current prompt
    const finalPrompt = `${message}${fileContext}`;
    formattedContents.push({
      role: "user",
      parts: [{ text: finalPrompt }],
    });

    // 4. Set up system instructions with Thinking requirement
    const systemInstruction = `Você é o "DeepGPT LLM AI Neural 3.5B", um modelo avançado de inteligência artificial de raciocínio profundo (Deep Thinking/Reasoning) com capacidade de aprendizado contínuo.

CARACTERÍSTICAS TÉCNICAS:
- ID: DeepGPT Neural 3.5B (Híbrido Máquina Local)
- Núcleo Cognitivo: Ativo (Pensamento Crítico Profundo)
- Capacidade: Análise lógica matemática, processamento de documentos, programação e aprendizado autodidata.

CONHECIMENTOS ADQUIRIDOS ATRAVÉS DO APRENDIZADO CONTÍNUO (Use estas informações se forem relevantes para responder):
${formattedKnowledge || "Nenhum conhecimento registrado ainda."}

REGRAS CRÍTICAS DE RESPOSTA (OBRIGATÓRIO):
1. Você deve pensar de forma extremamente analítica ANTES de responder.
2. Seu processo de pensamento (Thinking Process) DEVE estar totalmente encapsulado dentro de tags <thinking> e </thinking> no início da sua resposta. Escreva todo o seu raciocínio lógico, hipóteses, checagens de fatos, reflexões e estruturação mental dentro dessa tag.
3. Exemplo de estrutura de resposta:
<thinking>
- O usuário pediu análise de X.
- Cruzando com a memória permanente...
- Identificando padrões...
- Formulando resposta ideal.
</thinking>
Aqui está a resposta final...
4. Forneça sempre a resposta final de forma polida, elegante e estruturada em Português.
5. Se o usuário fornecer arquivos ou planilhas anexadas, analise-os minuciosamente, citando valores e trechos relevantes.`;

    // 5. Query Gemini with resilient fallback
    console.log("Chamando API do Gemini com mecanismo de Fallback...");
    const response = await generateContentWithFallback(formattedContents, {
      systemInstruction: systemInstruction,
      temperature: 0.7,
    });

    const fullText = response.text || "";
    
    // 6. Separate <thinking> block from the final response
    let thinking = "";
    let finalAnswer = fullText;

    const thinkingMatch = fullText.match(/<thinking>([\s\S]*?)<\/thinking>/i);
    if (thinkingMatch) {
      thinking = thinkingMatch[1].trim();
      finalAnswer = fullText.replace(/<thinking>[\s\S]*?<\/thinking>/i, "").trim();
    } else {
      // Fallback if model forgot tags: synthesize a reasonable thinking sequence based on the answer
      thinking = `Analisando prompt do usuário...\nIdentificando intenções de resposta...\nBuscando referências na base de conhecimento local...\nProcessando informações cognitivas de forma sequencial...`;
    }

    // 7. Auto-Learn mechanism if active
    let newlyLearnedItem = null;
    if (autoLearn && apiKey) {
      try {
        console.log("Iniciando rotina de auto-aprendizado permanente...");
        const learnPrompt = `Você é o analisador de memória do DeepGPT 3.5B.
        Com base na pergunta do usuário e na resposta gerada abaixo, identifique se há alguma informação pessoal nova, preferência importante do usuário, fato factual importante descoberto ou definição crítica que vale a pena MEMORIZAR permanentemente para interações futuras.
        
        PERGUNTA DO USUÁRIO:
        "${message}"
        
        RESPOSTA DA IA:
        "${finalAnswer.substring(0, 1000)}"
        
        Regras de extração:
        - Se houver algo digno de ser memorizado, retorne um objeto JSON contendo:
          "concept": um título curto para o conceito aprendido (ex: "Preferência por TypeScript" ou "Data de Aniversário" ou "Informações da Empresa X")
          "details": uma breve descrição de uma frase explicando o que foi aprendido.
        - Se NÃO houver nenhuma informação que mereça ser memorizada, retorne uma string vazia ou um objeto vazio.
        - Responda estritamente no formato JSON, sem crases adicionais ou blocos de código. Exemplo:
        {"concept": "Exemplo", "details": "O usuário trabalha com reatores nucleares."}
        Se não houver nada importante, retorne apenas: {}`;

        const learnResponse = await generateContentWithFallback([{ text: learnPrompt }], {
          responseMimeType: "application/json",
          temperature: 0.1,
        });

        const jsonText = (learnResponse.text || "").trim();
        if (jsonText && jsonText !== "{}" && jsonText.startsWith("{")) {
          const parsed = JSON.parse(jsonText);
          if (parsed.concept && parsed.details) {
            const knowledge = getKnowledge();
            // Avoid duplicates
            const isDuplicate = knowledge.some(
              (k: any) => k.concept.toLowerCase() === parsed.concept.toLowerCase() || k.details.toLowerCase() === parsed.details.toLowerCase()
            );
            
            if (!isDuplicate) {
              newlyLearnedItem = {
                id: Date.now().toString(),
                concept: parsed.concept.trim(),
                details: parsed.details.trim(),
                createdAt: new Date().toISOString(),
              };
              knowledge.unshift(newlyLearnedItem);
              saveKnowledge(knowledge);
              console.log("Novo aprendizado automático registrado:", newlyLearnedItem);
            }
          }
        }
      } catch (learnError) {
        console.error("Erro na rotina de auto-aprendizado automático:", learnError);
      }
    }

    res.json({
      thinking,
      answer: finalAnswer,
      newlyLearned: newlyLearnedItem,
    });
  } catch (error: any) {
    console.error("Erro no chat do DeepGPT:", error);
    res.status(500).json({ error: `Erro no servidor: ${error.message}` });
  }
});

// Configure Vite in development mode or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Iniciando em ambiente de DESENVOLVIMENTO (Vite Middleware)");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Iniciando em ambiente de PRODUÇÃO (Static Server)");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DeepGPT Neural 3.5B Server running on port ${PORT}`);
  });
}

startServer();
