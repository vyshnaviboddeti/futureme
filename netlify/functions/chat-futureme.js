const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
  // Allow preflight CORS requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ 
          success: false, 
          error: "FutureMe could not respond right now. (API Key is not configured on Netlify. Please set GEMINI_API_KEY in site environment variables.)" 
        })
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { userProfile, chatHistory, question } = JSON.parse(event.body);

    if (!userProfile || !question) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, error: "userProfile and question are required." })
      };
    }

    const { name, age, goal, struggle, oneYearVision, tone } = userProfile;
    
    const getToneDescription = (tone) => {
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
    };
    
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

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: true,
        reply: replyText.trim()
      })
    };

  } catch (error) {
    console.error("Error in chat function:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: false,
        error: "FutureMe could not respond right now. Try again."
      })
    };
  }
};
