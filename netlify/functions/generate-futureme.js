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
    const { name, age, goal, struggle, oneYearVision, tone } = JSON.parse(event.body);

    if (!name || !age || !goal || !struggle || !oneYearVision || !tone) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, error: "All fields are required." })
      };
    }

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
  "mantra": "A short memorable line they can repeat daily.",
  "dailyPlan": [
    {
      "day": "Day 1",
      "focus": "Focus of the day (e.g. Audit & Reset)",
      "action": "Concrete action step to perform today.",
      "motivation": "A short motivational boost from the future self in the selected tone."
    },
    {
      "day": "Day 2",
      "focus": "...",
      "action": "...",
      "motivation": "..."
    },
    {
      "day": "Day 3",
      "focus": "...",
      "action": "...",
      "motivation": "..."
    },
    {
      "day": "Day 4",
      "focus": "...",
      "action": "...",
      "motivation": "..."
    },
    {
      "day": "Day 5",
      "focus": "...",
      "action": "...",
      "motivation": "..."
    },
    {
      "day": "Day 6",
      "focus": "...",
      "action": "...",
      "motivation": "..."
    },
    {
      "day": "Day 7",
      "focus": "...",
      "action": "...",
      "motivation": "..."
    }
  ]
}

Make it specific. Avoid generic motivation. Avoid clichés. Make it emotional but practical. Must return exactly 7 days in the dailyPlan array.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const cleanAndParseJSON = (text) => {
      let cleaned = text.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
        cleaned = cleaned.replace(/\s*```$/, "");
      }
      cleaned = cleaned.trim();
      return JSON.parse(cleaned);
    };

    const responseData = cleanAndParseJSON(responseText);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: true,
        data: responseData
      })
    };

  } catch (error) {
    console.error("Error in generate function:", error);
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
