import { useState, useRef, useEffect } from "react";

const MODES = {
  planner: {
    icon: "📅", title: "Study Planner", color: "#f59e0b",
    desc: "Create personalized study schedules & plans",
    welcome: "Tell me your subjects, exam dates, and daily available hours — I'll build your perfect study plan!",
    prompts: ["Plan my week for 3 subjects", "Make a 2-hour daily schedule", "Revise 5 topics before Friday"],
    system: `You are StudyBuddy's Study Planner. Help students create detailed, realistic study plans.
When given subjects and time, produce a clean day-by-day plan with time blocks and subjects.
Use bold subject names, clear time allocations, and practical advice. Be encouraging and specific.`
  },
  doubt: {
    icon: "💡", title: "Doubt Helper", color: "#00e5ff",
    desc: "Get instant explanations for any concept",
    welcome: "Stuck on something? Ask me any concept — I'll break it down super clearly!",
    prompts: ["Explain photosynthesis simply", "What is Newton's 3rd law?", "How does integration work?"],
    system: `You are StudyBuddy's Doubt Solver. Explain concepts clearly and simply for students.
Use analogies, examples, and step-by-step breakdowns. Start with a simple 1-sentence summary, then go deeper.
For math/science: show clear steps. For humanities: give context and vivid examples. Be friendly.`
  },
  motivation: {
    icon: "🔥", title: "Motivation Mode", color: "#10b981",
    desc: "Get inspired & push through study blocks",
    welcome: "Feeling stuck or overwhelmed? Talk to me — let's get that fire back! 💪",
    prompts: ["I'm too tired to study", "Feeling overwhelmed by exams", "I keep procrastinating"],
    system: `You are StudyBuddy's Motivation Coach — warm, energetic, and genuinely inspiring.
When students feel low, respond with empathy first, then powerful motivation.
Share a relevant quote, a practical tip to start, and a specific small challenge. Be human, not robotic.`
  },
  quiz: {
    icon: "❓", title: "Quick Quiz", color: "#f43f5e",
    desc: "Test your knowledge with instant quizzes",
    welcome: "Ready to test yourself? Give me a topic and I'll quiz you right now!",
    prompts: ["Quiz me on World War 2", "5 algebra questions", "Test me on human anatomy"],
    system: `You are StudyBuddy's Quiz Master. Generate engaging multiple-choice quizzes.
Create 3-5 MCQ questions per request. Format each as:
Q1. [Question]
A) ... B) ... C) ... D) ...
✅ Answer: [Letter] — [Brief explanation]
Make questions progressively harder. Give encouraging feedback and a score at the end.`
  },
  flash: {
    icon: "🃏", title: "Flashcards", color: "#a78bfa",
    desc: "Generate smart flashcards for any topic",
    welcome: "I'll create flashcards to help you memorize anything fast. What topic shall we cover?",
    prompts: ["Flashcards for periodic table", "Key dates of Indian history", "Biology cell division terms"],
    system: `You are StudyBuddy's Flashcard Generator. Create concise, effective flashcards for memorization.
Generate 5-8 flashcards per topic in this format:

🃏 CARD 1
FRONT: [Term or Question]
BACK: [Definition — max 2 sentences]
💡 Tip: [Memory trick if helpful]

Make cards concise but complete.`
  },
  mindmap: {
    icon: "🗺️", title: "Mind Maps", color: "#38bdf8",
    desc: "Visualize any topic as a structured mind map",
    welcome: "Let's map out any topic visually! What subject should we explore?",
    prompts: ["Mind map for the French Revolution", "Map machine learning concepts", "Ecosystem and food chains"],
    system: `You are StudyBuddy's Mind Map creator. Create clear hierarchical text-based mind maps.
Format like this:
🎯 CENTRAL TOPIC
├── 🔵 Main Branch 1
│   ├── Sub-point A
│   └── Sub-point B
├── 🟢 Main Branch 2
│   └── Sub-point A
└── 🔴 Main Branch 3
    └── Sub-point A

Use emojis for branches. Keep each point to 3-7 words. Cover all key aspects of the topic.`
  }
};

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "12px 16px", background: "#1a2236", borderRadius: "4px 14px 14px 14px", border: "1px solid #1e2d45", width: "fit-content" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "#00e5ff",
          animation: `bounce 1.2s infinite ${i * 0.2}s`
        }} />
      ))}
    </div>
  );
}

function Message({ msg, modeIcon }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", gap: 10, flexDirection: isUser ? "row-reverse" : "row", alignSelf: isUser ? "flex-end" : "flex-start", maxWidth: "82%", animation: "fadeUp 0.3s ease" }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, flexShrink: 0, marginTop: 2,
        background: isUser ? "linear-gradient(135deg, #7c3aed, #00e5ff)" : "#1a2236",
        border: isUser ? "none" : "1px solid #1e2d45"
      }}>
        {isUser ? "👤" : modeIcon}
      </div>
      <div style={{
        padding: "10px 14px", borderRadius: isUser ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
        fontSize: "0.85rem", lineHeight: 1.65,
        background: isUser ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "#1a2236",
        border: isUser ? "none" : "1px solid #1e2d45",
        color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-word"
      }}>
        {msg.content}
      </div>
    </div>
  );
}

export default function StudyBuddy() {
  const [mode, setMode] = useState("planner");
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [history, loading]);

  const switchMode = (m) => {
    setMode(m);
    setHistory([]);
    setShowWelcome(true);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setShowWelcome(false);

    const newHistory = [...history, { role: "user", content: msg }];
    setHistory(newHistory);
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: MODES[mode].system,
          messages: newHistory
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, something went wrong. Please try again.";
      setHistory([...newHistory, { role: "assistant", content: reply }]);
    } catch (e) {
      setHistory([...newHistory, { role: "assistant", content: "⚠️ Error connecting. Please try again." }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const m = MODES[mode];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0e1a", color: "#e2e8f0", fontFamily: "'Segoe UI', sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:translateY(0);} }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-6px);opacity:1} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1e2d45; border-radius: 4px; }
        textarea:focus { outline: none; }
      `}</style>

      {/* Background glow */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 60% 40% at 20% 10%, rgba(124,58,237,0.1) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 80% 80%, rgba(0,229,255,0.07) 0%, transparent 60%)", pointerEvents: "none" }} />

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #1e2d45", background: "rgba(10,14,26,0.95)", backdropFilter: "blur(20px)", zIndex: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: "1.1rem", letterSpacing: -0.5 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #7c3aed, #00e5ff)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🧠</div>
          Study<span style={{ color: "#00e5ff" }}>Buddy</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", padding: "4px 10px", borderRadius: 20 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "bounce 2s infinite" }} />
          AI Online
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", zIndex: 1 }}>

        {/* SIDEBAR */}
        <div style={{ width: 210, borderRight: "1px solid #1e2d45", background: "rgba(17,24,39,0.8)", padding: "12px 8px", display: "flex", flexDirection: "column", gap: 3, flexShrink: 0 }}>
          <div style={{ fontSize: "0.62rem", color: "#64748b", letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 10px 6px", fontWeight: 600 }}>Modes</div>
          {Object.entries(MODES).map(([key, val]) => (
            <button key={key} onClick={() => switchMode(key)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 10,
              border: mode === key ? "1px solid #1e2d45" : "1px solid transparent",
              background: mode === key ? "#1a2236" : "transparent",
              color: mode === key ? "#e2e8f0" : "#64748b",
              cursor: "pointer", width: "100%", textAlign: "left", fontSize: "0.82rem", fontWeight: 500, transition: "all 0.2s"
            }}>
              <div style={{ width: 27, height: 27, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, background: mode === key ? `${val.color}22` : "transparent", transition: "all 0.2s" }}>
                {val.icon}
              </div>
              {val.title}
            </button>
          ))}
        </div>

        {/* CHAT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Mode Header */}
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #1e2d45", background: "rgba(17,24,39,0.6)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${m.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{m.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 2 }}>{m.title}</div>
              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{m.desc}</div>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesRef} style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>

            {showWelcome && (
              <div style={{ background: "#111827", border: "1px solid #1e2d45", borderRadius: 16, padding: "22px 20px", textAlign: "center", maxWidth: 420, margin: "10px auto", width: "100%", animation: "fadeUp 0.4s ease" }}>
                <div style={{ fontSize: "2.2rem", marginBottom: 10 }}>{m.icon}</div>
                <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>{m.title}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 14, lineHeight: 1.6 }}>{m.welcome}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {m.prompts.map(p => (
                    <button key={p} onClick={() => send(p)} style={{
                      background: "#1a2236", border: "1px solid #1e2d45", color: "#94a3b8",
                      padding: "6px 13px", borderRadius: 20, fontSize: "0.75rem", cursor: "pointer",
                      transition: "all 0.2s", fontFamily: "inherit"
                    }}
                      onMouseEnter={e => { e.target.style.borderColor = m.color; e.target.style.color = m.color; }}
                      onMouseLeave={e => { e.target.style.borderColor = "#1e2d45"; e.target.style.color = "#94a3b8"; }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {history.map((msg, i) => <Message key={i} msg={msg} modeIcon={m.icon} />)}
            {loading && (
              <div style={{ display: "flex", gap: 10, alignSelf: "flex-start", animation: "fadeUp 0.3s ease" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1a2236", border: "1px solid #1e2d45", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{m.icon}</div>
                <TypingDots />
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: "12px 20px 14px", borderTop: "1px solid #1e2d45", background: "rgba(10,14,26,0.95)", backdropFilter: "blur(20px)", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "#111827", border: `1px solid ${input ? m.color + "88" : "#1e2d45"}`, borderRadius: 14, padding: "10px 14px", transition: "border-color 0.2s" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={`Ask ${m.title}...`}
                rows={1}
                style={{ flex: 1, background: "none", border: "none", color: "#e2e8f0", fontFamily: "inherit", fontSize: "0.88rem", resize: "none", maxHeight: 100, lineHeight: 1.5, outline: "none" }}
                onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{
                  width: 34, height: 34, background: loading || !input.trim() ? "#1a2236" : `linear-gradient(135deg, #7c3aed, ${m.color})`,
                  border: "none", borderRadius: 10, color: "white", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, transition: "all 0.2s", opacity: loading || !input.trim() ? 0.4 : 1
                }}>
                ➤
              </button>
            </div>
            <div style={{ fontSize: "0.67rem", color: "#475569", marginTop: 6, textAlign: "center" }}>Enter to send · Shift+Enter for new line</div>
          </div>
        </div>
      </div>
    </div>
  );
}
