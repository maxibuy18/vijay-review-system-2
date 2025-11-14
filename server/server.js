// server/server.js
import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const __dirname = path.resolve();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../frontend")));
app.post("/api/generate-review", async (req, res) => {
  const { rating, visit_when } = req.body || {};
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) {
    return res.status(500).json({ error: "OpenAI API key not configured." });
  }
  const prompt = `
आप "Vijay Jewellers" के लिए एक छोटा, सरल और ईमानदार Google Review ड्राफ्ट तैयार करें।
रेटिंग: ${rating || "N/A"}/5
आने का समय: ${visit_when || "उपलब्ध नहीं"}
रिव्यू 30–60 शब्दों का हो।
अंत में जोड़ें: "कृपया केवल तभी सबमिट करें जब यह आपके वास्तविक अनुभव से मेल खाता हो।"
`;
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.7
      })
    });
    const j = await r.json();
    const text = j.choices?.[0]?.message?.content?.trim() || "";
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Generation failed" });
  }
});
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
