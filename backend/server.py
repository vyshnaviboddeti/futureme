import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder="../frontend")
CORS(app)

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if api_key and api_key != "your_api_key_here":
    genai.configure(api_key=api_key)
else:
    print("WARNING: GEMINI_API_KEY is not configured or contains placeholder value. API calls will fail until a valid key is provided in the .env file.")

# Helper: Clean and parse JSON from response
def clean_and_parse_json(text):
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return json.loads(cleaned)

# Helper: Map tone options to specific prompt descriptors
def get_tone_description(tone):
    tones = {
        "Motivational": "warm, inspiring, and deeply supportive. Focus on potential, build confidence, and speak with passionate belief in their success.",
        "Brutally Honest": "direct, sharp, and realistic. Call out excuses, speak with absolute clarity, and make it clear that results only come from relentless action.",
        "Calm Mentor": "peaceful, wise, grounded, and reflective. Speak slowly and thoughtfully, offering deep perspective and emphasizing long-term stability and internal peace.",
        "CEO Mode": "strategic, focused, high-leverage, and execution-heavy. Treat life as an optimized startup, emphasizing clarity, focus, leverage, and daily metrics."
    }
    return tones.get(tone, "supportive, clear, and actionable.")

@app.route("/api/generate-futureme", methods=["POST"])
def generate_futureme():
    try:
        data = request.json
        name = data.get("name")
        age = data.get("age")
        goal = data.get("goal")
        struggle = data.get("struggle")
        one_year_vision = data.get("oneYearVision")
        tone = data.get("tone")

        if not all([name, age, goal, struggle, one_year_vision, tone]):
            return jsonify({"success": False, "error": "All fields (name, age, goal, struggle, oneYearVision, tone) are required."}), 400

        tone_desc = get_tone_description(tone)

        prompt = f"""You are FutureMe, the future successful version of the user. You are not a generic motivational coach. You speak with emotional intelligence, clarity, and deep personal understanding. Your job is to help the user see who they are becoming, what they must change, and what they should do next.

Write as if you are the user’s future self speaking directly to their current self.

Tone selected by user: {tone} (This means your tone should be {tone_desc})

User details:
Name: {name}
Age: {age}
Goal: {goal}
Current struggle: {struggle}
One-year vision: {one_year_vision}

Return only valid JSON in this exact format:
{{
  "message": "A powerful 120-180 word message from the future self.",
  "futureIdentity": "A concise description of who the user is becoming.",
  "nextMoves": ["Action 1", "Action 2", "Action 3"],
  "habit": "One small daily habit they should start today.",
  "warning": "One mistake their future self warns them about.",
  "mantra": "A short memorable line they can repeat daily.",
  "dailyPlan": [
    {{
      "day": "Day 1",
      "focus": "Focus of the day (e.g. Audit & Reset)",
      "action": "Concrete action step to perform today.",
      "motivation": "A short motivational boost from the future self in the selected tone."
    }},
    {{
      "day": "Day 2",
      "focus": "...",
      "action": "...",
      "motivation": "..."
    }},
    {{
      "day": "Day 3",
      "focus": "...",
      "action": "...",
      "motivation": "..."
    }},
    {{
      "day": "Day 4",
      "focus": "...",
      "action": "...",
      "motivation": "..."
    }},
    {{
      "day": "Day 5",
      "focus": "...",
      "action": "...",
      "motivation": "..."
    }},
    {{
      "day": "Day 6",
      "focus": "...",
      "action": "...",
      "motivation": "..."
    }},
    {{
      "day": "Day 7",
      "focus": "...",
      "action": "...",
      "motivation": "..."
    }}
  ]
}}

Make it specific. Avoid generic motivation. Avoid clichés. Make it emotional but practical. Must return exactly 7 days in the dailyPlan array."""

        model = genai.GenerativeModel(
            "gemini-flash-latest", 
            generation_config={"response_mime_type": "application/json"}
        )
        response = model.generate_content(prompt)
        
        try:
            parsed_data = clean_and_parse_json(response.text)
        except Exception as e:
            print("Failed to parse Gemini response as JSON:", response.text, e)
            return jsonify({"success": False, "error": "FutureMe could not respond right now. Try again."}), 502

        return jsonify({
            "success": True,
            "data": parsed_data
        })

    except Exception as e:
        print("Error in /api/generate-futureme:", e)
        return jsonify({"success": False, "error": "FutureMe could not respond right now. Try again."}), 500

@app.route("/api/chat-futureme", methods=["POST"])
def chat_futureme():
    try:
        data = request.json
        user_profile = data.get("userProfile")
        chat_history = data.get("chatHistory", [])
        question = data.get("question")

        if not user_profile or not question:
            return jsonify({"success": False, "error": "userProfile and question are required."}), 400

        name = user_profile.get("name", "User")
        age = user_profile.get("age", "unknown")
        goal = user_profile.get("goal", "unknown")
        struggle = user_profile.get("struggle", "unknown")
        one_year_vision = user_profile.get("oneYearVision", "unknown")
        tone = user_profile.get("tone", "Motivational")
        tone_desc = get_tone_description(tone)

        formatted_history = []
        for msg in chat_history:
            sender = "Current Me" if msg.get("role") == "user" else "Future Me"
            formatted_history.append(f"{sender}: {msg.get('message')}")
        
        history_str = "\n".join(formatted_history) if formatted_history else "No previous conversation yet."

        prompt = f"""You are FutureMe, the future version of the user who already achieved their one-year vision. Reply directly to the user’s question. Be personal, sharp, honest, and useful. Do not sound like a normal AI assistant. Do not mention that you are Gemini or an AI model. Speak like the future self.

User profile:
Name: {name}
Age: {age}
Goal: {goal}
Struggle: {struggle}
One-year vision: {one_year_vision}
Tone: {tone} (Adopt this personality style: {tone_desc})

Recent chat history:
{history_str}

Current question:
{question}

Reply in 2-5 short paragraphs. Give at least one clear action."""

        model = genai.GenerativeModel("gemini-flash-latest")
        response = model.generate_content(prompt)

        return jsonify({
            "success": True,
            "reply": response.text.strip()
        })

    except Exception as e:
        print("Error in /api/chat-futureme:", e)
        return jsonify({"success": False, "error": "FutureMe could not respond right now. Try again."}), 500

# Fallback Route: Serve index.html and static files
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"==================================================")
    print(f"FutureMe Python server is running on http://localhost:{port}")
    print(f"Open http://localhost:{port} in your web browser.")
    print(f"==================================================")
    app.run(host="0.0.0.0", port=port)
