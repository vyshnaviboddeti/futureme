require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & JSON Parsing
app.use(cors());
app.use(express.json());

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, "../frontend")));

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let genAI;
if (apiKey && apiKey !== "your_api_key_here") {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn("WARNING: GEMINI_API_KEY is not configured or contains placeholder value. API calls will fail until a valid key is provided in the .env file.");
}

// Helper: Clean and Parse JSON safely
function cleanAndParseJSON(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
  }
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

// Helper: Map tone to descriptive instructions for Gemini
function getToneDescription(tone) {
  switch (tone) {
    case "Motivational":
      return "warm, inspiring, and deeply supportive. Focus on potential, build confidence, and speak with passionate belief in their success.";
    case "Brutally Honest":
      return "direct, sharp, and realistic. Call out excuses, speak with absolute clarity, and make it clear that results only come from relentless action.";
    case "Calm Mentor":
      return "peaceful, wise, grounded, and reflective. Speak slowly and thoughtfully, offering deep perspective and emphasizing long-term stability and internal peace.";
    case "CEO Mode":
      return "strategic, focused, high-leverage, and execution-heavy. Treat life as an optimized startup, emphasizing clarity, focus, leverage, and daily metrics.";
    default:
      return "supportive, clear, and actionable.";
  }
}

// POST /api/generate-futureme
app.post("/api/generate-futureme", async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        success: false,
        error: "FutureMe could not respond right now. (API Key is not configured on the server. Please add your GEMINI_API_KEY in the backend .env file.)"
      });
    }

    const { name, age, goal, struggle, oneYearVision, tone } = req.body;

    if (!name || !age || !goal || !struggle || !oneYearVision || !tone) {
      return res.status(400).json({
        success: false,
        error: "All fields (name, age, goal, struggle, oneYearVision, tone) are required."
      });
    }

    const toneDesc = getToneDescription(tone);

    const prompt = `You are FutureMe, the future successful version of the user. You are not a generic motivational coach. You speak with emotional intelligence, clarity, and deep personal understanding. Your job is to help the user see who they are becoming, what they must change, and what they should do next.

Write as if you are the user’s future self speaking directly to their current self.

Tone selected by user: ${tone} (This means your tone should be ${toneDesc})

User details:
Name: ${name}
Age: ${age}
Goal: ${goal}
Current struggle: ${struggle}
One-year vision: ${oneYearVision}

Return only valid JSON in this exact format:
{
  "message": "A powerful 120-180 word message from the future self.",
  "futureIdentity": "A concise description of who the user is becoming.",
  "nextMoves": ["Action 1", "Action 2", "Action 3"],
  "habit": "One small daily habit they should start today.",
  "warning": "One mistake their future self warns them about.",
  "mantra": "A short memorable line they can repeat daily."
}

Make it specific. Avoid generic motivation. Avoid clichés. Make it emotional but practical.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let responseData;
    try {
      responseData = cleanAndParseJSON(responseText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini response as JSON:", responseText, parseErr);
      return res.status(502).json({
        success: false,
        error: "FutureMe could not respond right now. Try again."
      });
    }

    return res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error("Error in /api/generate-futureme:", error);
    return res.status(500).json({
      success: false,
      error: "FutureMe could not respond right now. Try again."
    });
  }
});

// POST /api/chat-futureme
app.post("/api/chat-futureme", async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        success: false,
        error: "FutureMe could not respond right now. (API Key is not configured on the server. Please add your GEMINI_API_KEY in the backend .env file.)"
      });
    }

    const { userProfile, chatHistory, question } = req.body;

    if (!userProfile || !question) {
      return res.status(400).json({
        success: false,
        error: "userProfile and question are required."
      });
    }

    const { name, age, goal, struggle, oneYearVision, tone } = userProfile;
    const toneDesc = getToneDescription(tone);

    const formattedHistory = (chatHistory || [])
      .map(msg => {
        const sender = msg.role === "user" ? "Current Me" : "Future Me";
        return `${sender}: ${msg.message}`;
      })
      .join("\n");

    const prompt = `You are FutureMe, the future version of the user who already achieved their one-year vision. Reply directly to the user’s question. Be personal, sharp, honest, and useful. Do not sound like a normal AI assistant. Do not mention that you are Gemini or an AI model. Speak like the future self.

User profile:
Name: ${name || "User"}
Age: ${age || "unknown"}
Goal: ${goal || "unknown"}
Struggle: ${struggle || "unknown"}
One-year vision: ${oneYearVision || "unknown"}
Tone: ${tone || "Motivational"} (Adopt this personality style: ${toneDesc})

Recent chat history:
${formattedHistory || "No previous conversation yet."}

Current question:
${question}

Reply in 2-5 short paragraphs. Give at least one clear action.`;

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent(prompt);
    const replyText = result.response.text();

    return res.json({
      success: true,
      reply: replyText.trim()
    });

  } catch (error) {
    console.error("Error in /api/chat-futureme:", error);
    return res.status(500).json({
      success: false,
      error: "FutureMe could not respond right now. Try again."
    });
  }
});

// Fallback Route: Serve index.html for SPA behavior
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`FutureMe server is running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your web browser.`);
  console.log(`==================================================`);
});
