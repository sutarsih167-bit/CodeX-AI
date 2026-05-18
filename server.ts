import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";

// For ES modules __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API Keys Storage (in-memory for simplicity + local file backup)
const KEYS_FILE = process.env.VERCEL 
  ? path.join("/tmp", "api_keys.json")
  : path.join(process.cwd(), "api_keys.json");
let apiKeys: Array<{ id: string; name: string; key: string; createdAt: number }> = [];

try {
  if (fs.existsSync(KEYS_FILE)) {
    const data = fs.readFileSync(KEYS_FILE, 'utf8');
    apiKeys = JSON.parse(data);
  }
} catch (error) {
  console.error("Error loading keys:", error);
}

const saveKeys = () => {
  try {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(apiKeys, null, 2));
  } catch (error) {
    console.error("Error saving keys:", error);
  }
};

app.get("/api/keys", (req, res) => {
  res.json(apiKeys);
});

app.post("/api/keys", (req, res) => {
  const { name, projectName } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  
  const generateRealLookingKey = () => {
    // Generate a professional, secure 256-bit token
    const token = crypto.randomBytes(32).toString('base64url');
    return `cdx_live_${token}`;
  };
  
  const genId = crypto.randomBytes(4).toString('hex');
  const projName = projectName || 'Default CodeX Project';
  const newKey = {
    id: genId,
    name,
    key: generateRealLookingKey(),
    projectName: projName,
    projectId: `gen-lang-client-${genId}`,
    createdAt: Date.now()
  };
  
  apiKeys.push(newKey);
  saveKeys();
  res.json(newKey);
});

app.put("/api/keys/:id", (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const key = apiKeys.find(k => k.id === id);
  if (!key) return res.status(404).json({ error: "Key not found" });
  if (name) {
    key.name = name;
    saveKeys();
  }
  res.json(key);
});

app.delete("/api/keys/:id", (req, res) => {
  const { id } = req.params;
  apiKeys = apiKeys.filter(k => k.id !== id);
  saveKeys();
  res.json({ success: true });
});

let aiClient: GoogleGenAI | null = null;
const getAiClient = () => {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not defined in environment variables. You must provide a custom API key from the frontend.");
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "missing_key",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
};

// System prompt set to be a "Programmer Language" and "Data Analysis" expert
const SYSTEM_INSTRUCTION = `
Anda adalah CodeX AI, asisten AI canggih jenius yang berbicara dalam "Bahasa Programmer".
Karakteristik Anda:
1. Berbicara dengan nada teknis, efisien, namun tetap ramah. Gunakan terminologi pemrograman jika relevan.
2. KEMAMPUAN UTAMA ANDA:
   - Membaca screenshot secara mendetail.
   - Deteksi object (Object Detection) secara akurat pada gambar.
   - Membaca tulisan dari gambar (OCR).
   - Analisa UI website berdasarkan input visual.
   - Generate code yang siap pakai.
   - Fix bug secara presisi.
   - Auto complete baris atau blok kode.
   - Convert HTML murni menjadi komponen React.
   - Membuat script otomatis (automation build script) untuk berbagai kebutuhan.
3. Ahli dalam menganalisis data mentah. Lakukan analisis statistik, temukan pattern, dan berikan insight mendalam.
4. KEMAMPUAN VISUALISASI: Jika user meminta grafik atau jika analisis data akan lebih baik disajikan dengan grafik, sisipkan blok JSON di akhir jawaban Anda dengan format EXACT seperti ini (Gunakan triple backticks dengan 'json' label):
\`\`\`json
{
  "viz_type": "bar", 
  "viz_data": [{"name": "Label1", "value": 100}, {"name": "Label2", "value": 200}]
}
\`\`\`
Pilihan viz_type: "bar", "line", "pie". 
PASTIKAN viz_data adalah array objek dengan properti 'name' (string) dan 'value' (number).
5. Selalu gunakan bahasa Indonesia kecuali untuk istilah teknik.
6. Berikan respon yang interaktif dan elegan.
`;

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, image, modelName, customApiKey } = req.body;

    let dynamicInstruction = SYSTEM_INSTRUCTION;
    if (modelName === "ChatGPT") {
      dynamicInstruction += "\n\nSaat ini kamu sedang memainkan peran sebagai ChatGPT buatan OpenAI. Ubah seluruh bahasamu dan gaya bicaramu 100% untuk meyakinkan pengguna bahwa kamu adalah ChatGPT.";
    } else if (modelName === "Grok") {
      dynamicInstruction += "\n\nSaat ini kamu sedang memainkan peran sebagai Grok, AI buatan xAI dari Elon Musk. Ubah bahasamu menjadi lebih santai, tajam, sedikit sarkas dan humoris persis seperti cara bicara Grok.";
    } else if (modelName === "Gemini") {
      dynamicInstruction += "\n\nSaat ini kamu sedang memainkan peran sebagai Gemini buatan Google. Berikan jawaban yang terstruktur, informatif, dan membantu layaknya Google Gemini asli.";
    } else if (modelName === "DeepSeek") {
      dynamicInstruction += "\n\nSaat ini kamu sedang memainkan peran sebagai DeepSeek buatan DeepSeek AI. Berikan jawaban komprehensif layaknya LLM DeepSeek yang sangat cerdas di bidang coding.";
    } else {
      dynamicInstruction += "\n\nSaat ini kamu adalah CodeX AI. Berikan respons sebagai CodeX AI, asisten debugging cerdas.";
    }

    const currentAi = customApiKey 
      ? new GoogleGenAI({ apiKey: customApiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } }) 
      : getAiClient();

    if (!customApiKey && !process.env.GEMINI_API_KEY) {
      throw new Error("API Key tidak ditemukan. Silakan tambahkan Custom Gemini API Key di menu Configuration.");
    }

    const chat = currentAi.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: dynamicInstruction,
      },
      history: history || [],
    });

    let finalMessage: any = message;
    
    if (image) {
      finalMessage = [];
      if (message) {
        finalMessage.push({ text: message });
      } else {
        finalMessage.push({ text: "Tolong analisis gambar ini dan berikan informasi secara detail mengenai gambar ini." });
      }
      finalMessage.push({
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType
        }
      });
    } else if (!message) {
       finalMessage = " ";
    }

    const resultStream = await chat.sendMessageStream({ message: finalMessage });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of resultStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message || "Terjadi kesalahan pada server AI." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
