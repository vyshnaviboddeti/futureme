# FutureMe — Meet The Person You're Becoming

FutureMe is a premium, AI-powered personal reflection web application. Users input details about their current life, goals, struggles, and long-term vision, and the app connects them to their future self via a personalized, emotionally resonant letter and an ongoing chat session powered by the Gemini API.

The application features a sleek, Apple-style dark layout with high-fidelity glassmorphism, progressive timeline-alignment loading animations, interactive metrics dashboards, and a live context-aware chat interface.

---

## Quick Start (No Node.js / NPM Required!)

Since Node.js/NPM is not installed on your system but **Python** is available in your PATH, we have provided a Python Express-equivalent Flask server and a single-click startup script:

1. Double-click the **`run.bat`** file located in the root of the `futureme/` folder.
2. The script will automatically:
   - Install dependencies (`flask`, `flask-cors`, `google-generativeai`, `python-dotenv`).
   - Start the backend server on port `5000`.
   - Serve the frontend application.
3. Open your browser and navigate to: **[http://localhost:5000](http://localhost:5000)**.

---

## Project Structure

```text
futureme/
  frontend/
    index.html        # Main HTML file with Apple-style dark UI layout
    style.css         # Glassmorphism design system & micro-animations
    script.js         # Fetch API client, state management, and DOM handlers
  backend/
    server.py         # [Flask Backend] Python alternative (uses Flask + Gemini SDK)
    server.js         # [Express Backend] Node.js alternative
    package.json      # Express, CORS, Dotenv, and @google/generative-ai
    .env              # Environment variable values (port, key)
    .env.example      # Example environment config template
  run.bat             # Auto-installer & server launcher for Windows (Python)
  README.md           # Instructions and documentation
```

---

## Manual Installation & Setup

### Option A: Python Backend (Recommended for your environment)

Navigate to the project directory and run:
```bash
# Install dependencies
pip install flask flask-cors google-generativeai python-dotenv

# Run the server
cd backend
python server.py
```

---

### Option B: Node.js Backend (Requires Node.js installation)

If you decide to install Node.js later:
```bash
# Install dependencies
cd backend
npm install

# Run the server
npm run dev
```

---

## Backend API Routes

The server exposes two secure endpoints:

### 1. `POST /api/generate-futureme`
Generates a structured, JSON-formatted letter from the future self based on current constraints.

* **Request Body:**
  ```json
  {
    "name": "Nitish",
    "age": "23",
    "goal": "Build a successful AI startup",
    "struggle": "Lack of consistency",
    "oneYearVision": "Running a profitable AI company",
    "tone": "Brutally Honest"
  }
  ```

### 2. `POST /api/chat-futureme`
Starts or continues an interactive diagnostic chat dialog thread with the user's FutureMe, keeping full conversation history context in mind.

* **Request Body:**
  ```json
  {
    "userProfile": {
      "name": "Nitish",
      "age": "23",
      "goal": "Build a successful AI startup",
      "struggle": "Lack of consistency",
      "oneYearVision": "Running a profitable AI company",
      "tone": "Brutally Honest"
    },
    "chatHistory": [
      {
        "role": "user",
        "message": "Will I actually make it?"
      }
    ],
    "question": "What should I focus on this week?"
  }
  ```
