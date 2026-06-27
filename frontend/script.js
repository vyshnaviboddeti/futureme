// State Management
let userProfileData = null;
let conversationHistory = [];
const API_BASE_URL = window.location.origin; // Serve relative to where server runs

// Intersection Observer for Scroll Reveals
document.addEventListener("DOMContentLoaded", () => {
    const reveals = document.querySelectorAll(".reveal");
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                
                // If it's the dashboard grid, animate the charts once visible
                if (entry.target.classList.contains("dashboard-grid") && userProfileData) {
                    animateDashboardCharts();
                }
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach(element => observer.observe(element));
    
    // Check if initial scroll triggers anything
    setTimeout(() => {
        reveals.forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight) {
                el.classList.add("active");
            }
        });
    }, 150);

    // Mobile Menu Toggle
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", () => {
            navMenu.classList.toggle("mobile-active");
            menuToggle.classList.toggle("active");
        });
    }
});

// Select Personality Tone
function setPersonality(element, tone) {
    // Remove active class from all options
    const options = document.querySelectorAll(".personality-option");
    options.forEach(opt => opt.classList.remove("active"));
    
    // Add active class to selected option
    element.classList.add("active");
    
    // Set hidden input value
    document.getElementById("selectedPersonality").value = tone;
}

// Simulated progressive loading messages for the premium Apple feel
function runLoader(onComplete) {
    const loaderContainer = document.getElementById("appLoader");
    const form = document.getElementById("identityForm");
    const loaderText = document.getElementById("loaderText");
    const progressBar = document.getElementById("appProgressBar");
    
    form.style.opacity = "0.2";
    form.style.pointerEvents = "none";
    loaderContainer.style.display = "flex";
    
    const steps = [
        { text: "Establishing timeline alignment...", progress: "15%" },
        { text: "Analyzing current constraints & struggles...", progress: "45%" },
        { text: "Synthesizing one-year target core...", progress: "70%" },
        { text: "Receiving transmission from Future Self...", progress: "90%" }
    ];
    
    let currentStep = 0;
    
    const interval = setInterval(() => {
        if (currentStep < steps.length) {
            loaderText.innerText = steps[currentStep].text;
            progressBar.style.width = steps[currentStep].progress;
            progressBar.style.transition = "width 800ms cubic-bezier(0.22, 1, 0.36, 1)";
            currentStep++;
        } else {
            clearInterval(interval);
            onComplete();
        }
    }, 900);
}

// Generate Identity Submission
async function generateIdentity(event) {
    event.preventDefault();
    
    const name = document.getElementById("userName").value.trim();
    const age = document.getElementById("userAge").value.trim();
    const goal = document.getElementById("userDream").value.trim();
    const struggle = document.getElementById("userStruggle").value.trim();
    const oneYearVision = document.getElementById("userTarget").value.trim();
    const tone = document.getElementById("selectedPersonality").value;
    
    if (!name || !age || !goal || !struggle || !oneYearVision || !tone) {
        showToast("Please fill in all details before transmitting.");
        return;
    }
    
    // Save locally for chat context
    userProfileData = { name, age, goal, struggle, oneYearVision, tone };
    
    // Disable submit button
    const btnSubmit = document.getElementById("btnSubmitForm");
    btnSubmit.disabled = true;
    
    // Hide previous result if any
    document.getElementById("appResult").style.display = "none";
    
    // Run loaders & call backend api in parallel
    let apiResponse = null;
    let apiError = null;
    
    // Trigger API call
    const apiCallPromise = fetch(`${API_BASE_URL}/api/generate-futureme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userProfileData)
    })
    .then(res => res.json())
    .catch(err => {
        console.error("API Call error:", err);
        apiError = "FutureMe could not respond right now. Try again.";
    });
    
    runLoader(async () => {
        try {
            apiResponse = await apiCallPromise;
            
            const loaderContainer = document.getElementById("appLoader");
            const form = document.getElementById("identityForm");
            
            loaderContainer.style.display = "none";
            form.style.opacity = "1";
            form.style.pointerEvents = "auto";
            btnSubmit.disabled = false;
            
            if (apiError || !apiResponse || !apiResponse.success) {
                showToast(apiError || (apiResponse && apiResponse.error) || "FutureMe could not respond right now. Try again.");
                return;
            }
            
            // Populating UI with generated details
            const data = apiResponse.data;
            document.getElementById("resIdentityTitle").innerText = data.futureIdentity || "Your Realized Self";
            document.getElementById("resMsg").innerText = data.message;
            document.getElementById("resMove1").innerText = data.nextMoves[0] || "Execute with consistency.";
            document.getElementById("resMove2").innerText = data.nextMoves[1] || "Focus on daily leverage.";
            document.getElementById("resMove3").innerText = data.nextMoves[2] || "Remove cognitive friction.";
            document.getElementById("resHabitDesc").innerText = data.habit || "Small daily action step.";
            document.getElementById("resWarningDesc").innerText = data.warning || "Avoid temporary distraction.";
            document.getElementById("resMantra").innerText = `“ ${data.mantra || "Focus, Execute, Evolve."} ”`;
            
            // Current → Future transition nodes
            document.getElementById("resTfCurrent").innerText = userProfileData.struggle;
            document.getElementById("resTfFuture").innerText = data.futureIdentity;
            
            // Display Results
            const resultBox = document.getElementById("appResult");
            resultBox.style.display = "flex";
            
            // Scroll result into view smoothly
            resultBox.scrollIntoView({ behavior: "smooth" });
            
            // Update and display dashboard charts
            updateDashboardMetrics(data);
            
            // Render 7-day daily action plan
            renderDailyPlan(data.dailyPlan);
            
            // Initialize chat interface with context
            initChatSection(data);
            
            showToast("Timeline transmission received.");
        } catch (e) {
            console.error(e);
            showToast("FutureMe could not respond right now. Try again.");
            btnSubmit.disabled = false;
        }
    });
}

// Initialize Chat Area
function initChatSection(data) {
    const chatSection = document.getElementById("chat");
    const chatWindow = document.getElementById("chatWindow");
    
    // Reset conversation history
    conversationHistory = [];
    
    // Set up initial message
    const initialMessage = `Hello, ${userProfileData.name}. I am the version of you who overcame ${userProfileData.struggle} and achieved our dream: ${userProfileData.goal}. I've sent you this transmission from one year out. Let's discuss what it takes to close the distance. Ask me anything.`;
    
    conversationHistory.push({
        role: "futureme",
        message: initialMessage
    });
    
    // Clear & populate chat window
    chatWindow.innerHTML = `
        <div class="chat-bubble future">
            ${initialMessage}
        </div>
    `;
    
    // Reveal chat section
    chatSection.style.display = "block";
    
    // Animate reveal scroll
    setTimeout(() => {
        chatSection.classList.add("reveal", "active");
    }, 200);
}

// Send message to FutureMe chat API
async function sendChatMessage(event) {
    event.preventDefault();
    
    const input = document.getElementById("chatInput");
    const question = input.value.trim();
    if (!question) return;
    
    // UI feedback: Append user message
    appendChatBubble("user", question);
    input.value = "";
    
    // Update local state
    const userMessageObj = { role: "user", message: question };
    conversationHistory.push(userMessageObj);
    
    // Show typing loader
    const indicator = document.getElementById("typingIndicator");
    const chatWindow = document.getElementById("chatWindow");
    indicator.style.display = "flex";
    chatWindow.scrollTop = chatWindow.scrollHeight;
    
    // Disable inputs
    const btnSend = document.getElementById("btnSendChat");
    btnSend.disabled = true;
    input.disabled = true;
    
    try {
        const payload = {
            userProfile: userProfileData,
            chatHistory: conversationHistory.slice(0, -1), // History excluding current question
            question: question
        };
        
        const response = await fetch(`${API_BASE_URL}/api/chat-futureme`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        const resData = await response.json();
        
        indicator.style.display = "none";
        btnSend.disabled = false;
        input.disabled = false;
        input.focus();
        
        if (resData && resData.success) {
            appendChatBubble("future", resData.reply);
            conversationHistory.push({ role: "futureme", message: resData.reply });
        } else {
            appendChatBubble("system-error", "FutureMe could not respond right now. Try again.");
        }
    } catch (err) {
        console.error(err);
        indicator.style.display = "none";
        btnSend.disabled = false;
        input.disabled = false;
        appendChatBubble("system-error", "FutureMe could not respond right now. Try again.");
    }
}

// Append Chat Bubble Node
function appendChatBubble(role, message) {
    const chatWindow = document.getElementById("chatWindow");
    const bubble = document.createElement("div");
    
    bubble.className = `chat-bubble ${role}`;
    bubble.innerText = message;
    
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Scroll to Chat Window smoothly
function scrollToChat() {
    document.getElementById("chat").scrollIntoView({ behavior: "smooth" });
}

// Reset form and UI back to initial state
function resetForm() {
    document.getElementById("identityForm").reset();
    document.getElementById("appResult").style.display = "none";
    document.getElementById("chat").style.display = "none";
    
    // Clear checklist
    document.getElementById("resDailyPlanGrid").innerHTML = "";
    document.getElementById("planProgressText").innerText = "0 of 7 Completed (0%)";
    completedDaysCount = 0;
    
    // Restore personality selector to Motivational
    const options = document.querySelectorAll(".personality-option");
    options.forEach(opt => {
        if (opt.dataset.tone === "Motivational") {
            opt.classList.add("active");
        } else {
            opt.classList.remove("active");
        }
    });
    document.getElementById("selectedPersonality").value = "Motivational";
    
    // Scroll back to top of form
    document.getElementById("app").scrollIntoView({ behavior: "smooth" });
}

// Copy results to clipboard as formatted text/markdown
function copyResultToClipboard() {
    if (!userProfileData) return;
    
    const identity = document.getElementById("resIdentityTitle").innerText;
    const message = document.getElementById("resMsg").innerText;
    const move1 = document.getElementById("resMove1").innerText;
    const move2 = document.getElementById("resMove2").innerText;
    const move3 = document.getElementById("resMove3").innerText;
    const habit = document.getElementById("resHabitDesc").innerText;
    const warning = document.getElementById("resWarningDesc").innerText;
    const mantra = document.getElementById("resMantra").innerText;
    
    // Format daily plan details
    let planText = "";
    const dayCards = document.querySelectorAll(".day-plan-card");
    if (dayCards.length > 0) {
        planText = "\n📅 7-DAY ACTION PLAN:\n";
        dayCards.forEach(card => {
            const num = card.querySelector(".day-number").innerText;
            const focus = card.querySelector(".day-focus").innerText;
            const action = card.querySelector(".day-action").innerText;
            const completed = card.classList.contains("completed") ? " [COMPLETED]" : "";
            planText += `- ${num} - ${focus}: ${action}${completed}\n`;
        });
    }

    const formattedText = `
---
✨ FUTURE ME TRANSMISSION ✨
For: ${userProfileData.name} (${userProfileData.age})
Tone: ${userProfileData.tone}

🎯 FUTURE IDENTITY:
${identity}

✍️ MESSAGE FROM YOUR FUTURE SELF:
"${message}"

🚀 NEXT THREE MOVES:
1. ${move1}
2. ${move2}
3. ${move3}

🔄 DAILY HABIT:
${habit}

⚠️ WARNING:
${warning}
${planText}
🧘 DAILY MANTRA:
${mantra}

Powered by Nitish's Founder Labs
---
    `.trim();
    
    navigator.clipboard.writeText(formattedText).then(() => {
        showToast("Transmission details copied to clipboard!");
    }).catch(err => {
        console.error("Clipboard copy failed:", err);
        showToast("Could not copy to clipboard. Please select and copy manually.");
    });
}

// Show Toast Alert
function showToast(message) {
    const toast = document.getElementById("copyToast");
    toast.innerText = message;
    toast.classList.add("show");
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

// Update dashboard metrics dynamically after generation
function updateDashboardMetrics(data) {
    // Generate scores based on personality and goal lengths
    const clarityScore = Math.floor(Math.random() * 15) + 81; // 81 - 95%
    const velocityMap = {
        "Motivational": "Optimized",
        "Brutally Honest": "Accelerating",
        "Calm Mentor": "Steady Flow",
        "CEO Mode": "Max Velocity"
    };
    
    document.getElementById("dbClarity").innerText = `${clarityScore}%`;
    document.getElementById("dbVelocity").innerText = velocityMap[userProfileData.tone] || "Optimal";
    document.getElementById("dbResonance").innerText = "Resonant";
    
    // Animate charts if currently visible
    animateDashboardCharts();
}

// Animate Dashboard visual bars
function animateDashboardCharts() {
    // Clarity chart bars
    const barHeights = ["35%", "50%", "62%", "80%", "92%"];
    for (let i = 1; i <= 5; i++) {
        const bar = document.getElementById(`bar${i}`);
        if (bar) {
            bar.style.height = barHeights[i - 1];
        }
    }
    
    // Velocity chart bars
    const velBarHeights = ["40%", "30%", "65%", "85%", "95%"];
    for (let i = 1; i <= 5; i++) {
        const bar = document.getElementById(`velBar${i}`);
        if (bar) {
            bar.style.height = velBarHeights[i - 1];
        }
    }
    
    // Resonance chart bars
    const resBarHeights = ["25%", "45%", "60%", "75%", "90%"];
    for (let i = 1; i <= 5; i++) {
        const bar = document.getElementById(`resBar${i}`);
        if (bar) {
            bar.style.height = resBarHeights[i - 1];
        }
    }
}

let completedDaysCount = 0;

function renderDailyPlan(dailyPlanArray) {
    const grid = document.getElementById("resDailyPlanGrid");
    const progressText = document.getElementById("planProgressText");
    grid.innerHTML = "";
    completedDaysCount = 0;
    
    if (!dailyPlanArray || !Array.isArray(dailyPlanArray) || dailyPlanArray.length === 0) {
        grid.innerHTML = "<p style='color: var(--text-tertiary); font-style: italic;'>No daily plan generated. Update your details and try again.</p>";
        progressText.innerText = "0 of 7 Completed (0%)";
        return;
    }
    
    dailyPlanArray.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "day-plan-card";
        card.id = `dayCard_${index}`;
        
        card.innerHTML = `
            <div class="day-checkbox" id="checkbox_${index}" onclick="toggleDayCompleted(${index})"></div>
            <div class="day-info">
                <span class="day-number">${item.day || `Day ${index + 1}`}</span>
                <span class="day-focus">${item.focus || "Daily Action Focus"}</span>
                <p class="day-action">${item.action || "Take this action step today."}</p>
                ${item.motivation ? `<p class="day-motivation">${item.motivation}</p>` : ''}
            </div>
        `;
        grid.appendChild(card);
    });
    
    updatePlanProgress(dailyPlanArray.length);
}

function toggleDayCompleted(index) {
    const checkbox = document.getElementById(`checkbox_${index}`);
    const card = document.getElementById(`dayCard_${index}`);
    
    checkbox.classList.toggle("checked");
    card.classList.toggle("completed");
    
    const totalDays = document.querySelectorAll(".day-plan-card").length;
    const completedDays = document.querySelectorAll(".day-plan-card.completed").length;
    completedDaysCount = completedDays;
    
    updatePlanProgress(totalDays);
    
    if (checkbox.classList.contains("checked")) {
        showToast("Day completed! Keep the momentum.");
    }
}

function updatePlanProgress(totalDays) {
    const progressText = document.getElementById("planProgressText");
    const percentage = totalDays > 0 ? Math.round((completedDaysCount / totalDays) * 100) : 0;
    progressText.innerText = `${completedDaysCount} of ${totalDays} Completed (${percentage}%)`;
    
    // Dynamically update the timeline alignment dashboard value
    const alignmentVal = document.getElementById("dbClarity");
    if (alignmentVal && userProfileData) {
        // Base alignment score + progress weighting
        const baseScore = 75;
        const currentScore = Math.min(100, baseScore + Math.round((completedDaysCount / totalDays) * 25));
        alignmentVal.innerText = `${currentScore}%`;
        
        // Boost clarity bar charts based on progress
        for (let i = 1; i <= 5; i++) {
            const bar = document.getElementById(`bar${i}`);
            if (bar) {
                const targetHeight = Math.min(100, (currentScore - 20) + (i * 4));
                bar.style.height = `${targetHeight}%`;
            }
        }
    }
}
