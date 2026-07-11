import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// 所有配置从 .env 读取
const PYTHON_BACKEND = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

app.use(express.json());

// proxy to Python FastAPI backend
app.get("/api/metrics", async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_BACKEND}/api/metrics`);
    if (!response.ok) {
      return res.status(response.status).json(await response.json());
    }
    res.json(await response.json());
  } catch (error) {
    res.status(503).json({ error: "后端服务不可用，请确认 Python FastAPI 服务已启动。" });
  }
});

// proxy to Python FastAPI backend
app.post("/api/predict", async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_BACKEND}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: "后端服务不可用，请确认 Python FastAPI 服务已启动。" });
  }
});

// AI sommelier via DeepSeek (OpenAI-compatible API)
app.post("/api/expert", async (req, res) => {
  try {
    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({ error: "DEEPSEEK_API_KEY 未配置，请在 .env 文件中设置。" });
    }

    const { features, prediction } = req.body;
    const systemPrompt = `You are an expert AI sommelier with deep knowledge of wine chemistry, sensory evaluation, and food pairing. Based on the user-provided chemical profile of a red wine and a machine learning model's prediction, give a brief, professional opinion on the wine's taste, structure, and food pairing recommendations.

Always respond in Chinese, keeping it engaging and elegant. Reference the model's high or low confidence if applicable, and point out specific features (like high alcohol, ideal pH, balanced acidity, etc.). Keep it concise, around 3-4 sentences.`;

    const userPrompt = `Chemical Profile:
${JSON.stringify(features, null, 2)}

Model Prediction: ${prediction.label === 1 ? "Premium Wine" : "Standard Wine"} (Confidence: ${(prediction.probability * 100).toFixed(1)}%)`;

    const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("DeepSeek API error:", data);
      return res.status(500).json({ error: data.error?.message || "AI 服务调用失败" });
    }

    res.json({ opinion: data.choices[0].message.content });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // server.js 与前端静态资源都输出到 dist，生产环境直接从当前目录提供文件。
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
