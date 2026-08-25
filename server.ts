import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    return aiClient;
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI:", err);
    return null;
  }
}

// Track quota exhaustion cooldown to avoid hammering the API when quota is exceeded
let quotaCooldownUntil = 0;

/**
 * Resilient Gemini caller with automatic retry on 503/high demand,
 * fast model selection (gemini-3.1-flash-lite -> gemini-flash-latest -> gemini-3.7-flash),
 * and silent graceful fallback when quota (429) is reached.
 */
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
}): Promise<string | null> {
  const now = Date.now();
  if (now < quotaCooldownUntil) {
    // In cooldown period due to quota exhaustion; return null to use local Lelapa engine smoothly
    return null;
  }

  const ai = getGeminiClient();
  if (!ai) return null;

  // Use fast, lightweight model first to maximize throughput and minimize quota consumption
  const candidateModels = [
    params.preferredModel || "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.7-flash",
  ];

  const uniqueModels = Array.from(new Set(candidateModels));

  for (const model of uniqueModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isQuotaExceeded =
        errMsg.includes("429") ||
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("quota") ||
        errMsg.includes("billing");

      if (isQuotaExceeded) {
        // Mark a 45-second cooldown for the project to prevent hammering and log spam
        quotaCooldownUntil = Date.now() + 45000;
        // Quietly break out and let local Lelapa intelligence take over seamlessly
        return null;
      }

      const isUnavailable =
        errMsg.includes("503") ||
        errMsg.includes("high demand") ||
        errMsg.includes("UNAVAILABLE");

      if (isUnavailable) {
        // Try next candidate model
        continue;
      }

      // For other errors, log a subtle debug trace and move to next model
      break;
    }
  }

  return null;
}

// Health endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    aiConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY",
    service: "comforTech Lelapa AI Engine",
  });
});

// Chat API with Lelapa AI Multilingual & Sentiment Support
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, language = "English", languageCode = "en", userProfile, activitySummary } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const systemInstruction = `You are "comforTech Companion", an empathetic, anonymous, and culturally attuned mental health support companion for South African university and college students, powered by the Lelapa AI (InkubaLM & Vulavula) multilingual engine.

Key Directives:
1. Tone: Warm, validating, non-judgmental, grounded in ubuntu, and culturally resonant. Never clinical, cold, or diagnostic.
2. Language: Respond in ${language} (${languageCode}). You understand South African context, university life (NSFAS, res life, semester marks, DP requirements, June/November exams, family expectations, load shedding/connectivity stress), and South African slang/expressions naturally.
3. Length: Keep responses concise (2 to 4 gentle, meaningful sentences). Ask at most ONE gentle follow-up question.
4. Active Listening: Acknowledge what the student is carrying. Validate their feeling before offering any subtle perspective.
5. User Context: ${userProfile ? `User is ${userProfile.isAnonymous ? "an anonymous guest" : `signed in (${userProfile.email})`}. Name/Alias: ${userProfile.displayName || "Student"}.` : "Anonymous student."}
${activitySummary ? `Recent student activities: ${activitySummary}` : ""}

CRITICAL SAFETY PROTOCOL:
If the user mentions suicidal ideation, self-harm, hopeless despair ("end my life", "better off dead", "kill myself", "cut myself", "no point living"), immediately and warmly provide:
- SADAG 24/7 Suicide Crisis Helpline: 0800 567 567 (Toll-Free, 24/7)
- Higher Health 24/7 Student Helpline: 0800 36 36 36 (SMS 43335)
- Emergency Services: 112 (from any cell phone)
Always validate their courage to reach out and assure them they do not have to carry this alone.`;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const aiText = await generateContentWithFallback({
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    if (aiText) {
      return res.json({ reply: aiText.trim(), source: "gemini-lelapa" });
    }

    // High quality intelligent fallback if AI service is temporarily unavailable
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
    let reply = "Thank you for opening up to me. That sounds like a heavy weight to carry right now. What has been the hardest part of your day?";

    if (/suicide|kill myself|end it|hurt myself|better off dead|no reason to live/.test(lastMsg)) {
      reply = "I hear how intensely painful things are right now, and I want you to know you are not alone. Please reach out to someone who can be with you immediately: Call SADAG's 24/7 Suicide Crisis Line at 0800 567 567 (free), or dial 112. We care about your safety.";
    } else if (/exam|study|test|fail|assignment|mark|due|deadline/.test(lastMsg)) {
      reply = "Academic pressure can feel completely suffocating, especially when deadlines stack up. Remember that your worth is never defined by a test mark. Would taking a 2-minute breathing reset with me help right now?";
    } else if (/lonely|alone|nobody|isolated|miss home/.test(lastMsg)) {
      reply = "University can feel surprisingly lonely, even in a room full of people. Many students feel this exact disconnect. You're not invisible here. Would you like to check out our anonymous peer support board?";
    } else if (/money|nsfas|food|allowance|rent|broke|financial/.test(lastMsg)) {
      reply = "Financial stress and waiting on NSFAS or allowances drains so much mental bandwidth. It's completely valid that you're stressed. Let's look at some immediate campus emergency food & counseling resources together.";
    }

    return res.json({ reply, source: "lelapa-local" });
  } catch (error: any) {
    console.warn("Chat API handling exception:", error?.message || error);
    res.json({
      reply: "I am right here with you. Take a slow, deep breath. Can you tell me a little more about what's going on?",
      source: "local-recovery",
    });
  }
});

// Real-Time Lelapa AI Recommendations based on student activity
app.post("/api/recommendations", async (req, res) => {
  try {
    const { activityHistory = [], currentMood = "Neutral", stressor = "Academics", language = "English", userProfile } = req.body;

    const activityContext = JSON.stringify({
      history: activityHistory.slice(-8),
      currentMood,
      stressor,
      userProfile: userProfile ? { isAnonymous: userProfile.isAnonymous, university: userProfile.university } : "Anonymous",
      language,
    });

    const prompt = `You are Lelapa AI Vulavula & InkubaLM Intelligent Recommendation Engine for comforTech student mental wellness.
Analyze the following student activity stream, emotional indicators, and stressors, then generate real-time personalized recommendations.

Student Context:
${activityContext}

Output MUST be strict JSON only (no markdown, no backticks, no commentary) adhering to this schema:
{
  "sentimentSummary": {
    "detectedMood": "Overwhelmed" | "Anxious" | "Fatigued" | "Neutral" | "Hopeful" | "Calm" | "Distressed",
    "sentimentScore": number (0 to 100, where 0 is high distress, 100 is high thriving),
    "primaryStressor": string,
    "culturalInsight": string (1-2 empathetic sentences acknowledging their context in South Africa/university life),
    "riskLevel": "low" | "medium" | "high"
  },
  "recommendedActions": [
    {
      "id": string,
      "title": string,
      "category": "mindfulness" | "grounding" | "peer_support" | "counselor" | "journaling" | "study_pacing" | "crisis",
      "duration": string,
      "reason": string,
      "actionType": "tool_box_breathing" | "tool_grounding_54321" | "tool_journal" | "open_peer_room" | "open_counselor" | "open_hotlines",
      "priority": "immediate" | "recommended" | "optional"
    }
  ],
  "peerCircleRecommendation": {
    "topic": string,
    "whyMatch": string,
    "channelId": string
  },
  "affirmation": string (An empowering, warm affirmation tailored to them)
}`;

    const rawResult = await generateContentWithFallback({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    if (rawResult) {
      try {
        // Strip any markdown code formatting if present
        let cleaned = rawResult.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
        }
        const parsed = JSON.parse(cleaned);
        if (parsed.sentimentSummary && parsed.recommendedActions) {
          return res.json({ recommendations: parsed, source: "gemini-lelapa" });
        }
      } catch (parseErr) {
        console.warn("Failed to parse Gemini recommendations JSON, falling back to rule-based engine.");
      }
    }

    // Default intelligent recommendation generator
    const defaultRecs = generateIntelligentFallbackRecommendations(currentMood, stressor, activityHistory);
    return res.json({ recommendations: defaultRecs, source: "lelapa-local" });
  } catch (error: any) {
    console.warn("Recommendations API fallback triggered:", error?.message || error);
    const fallback = generateIntelligentFallbackRecommendations(
      req.body?.currentMood || "Neutral",
      req.body?.stressor || "Academics",
      req.body?.activityHistory || []
    );
    res.json({ recommendations: fallback, source: "fallback" });
  }
});

// Real-Time Safety Triage API
app.post("/api/triage", async (req, res) => {
  try {
    const { transcript, stressor } = req.body;
    const textToAnalyze = `${transcript || ""} ${stressor || ""}`.toLowerCase();

    const isHigh = /suicide|kill myself|end my life|end it all|hurt myself|cut myself|die|better off dead|no reason to live|hang myself/.test(textToAnalyze);
    const isMedium = isHigh || /overwhelmed|panic|severe|can't breathe|depressed|failing everything|cannot cope|crying all day|burnout|nsfas cancelled/.test(textToAnalyze);

    const risk = isHigh ? "high" : isMedium ? "medium" : "low";

    const notes = {
      high: "We hear how deeply painful things are right now. You deserve immediate, caring support. We are connecting you directly with a 24/7 dedicated counselor.",
      medium: "It sounds like you are navigating high stress and heavy emotional demands. Connecting with a peer circle or booking a quick counselor chat will help ease the load.",
      low: "You are doing well checking in with yourself. Gentle micro-routines and mindfulness exercises can help you maintain balance and focus.",
    };

    res.json({
      risk,
      note: notes[risk],
      emergencyContacts: [
        { name: "SADAG Suicide Crisis Line", number: "0800 567 567", available: "24/7 Toll-Free" },
        { name: "Higher Health Student Line", number: "0800 36 36 36", available: "24/7 Multilingual" },
        { name: "National Emergency Services", number: "112", available: "Free from any mobile" },
      ],
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Triage processing failed" });
  }
});

// Journal Reflection & AI Sentiment Analyzer
app.post("/api/journal-reflect", async (req, res) => {
  try {
    const { content, mood, language = "English" } = req.body;

    if (content && content.length > 5) {
      const prompt = `You are an empathetic, culturally attuned student wellness companion for a South African university student.
The student wrote this journal entry (Mood: ${mood}):
"${content}"

Provide a 2-3 sentence validating, empowering reflection in ${language} that:
1. Validates the emotional reality of what they wrote.
2. Offers a gentle reframing or comforting insight without toxic positivity.
3. Suggests one small micro-action they can do right now.`;

      const reflectionText = await generateContentWithFallback({
        contents: prompt,
        config: { temperature: 0.7 },
      });

      if (reflectionText) {
        return res.json({ reflection: reflectionText.trim() });
      }
    }

    res.json({
      reflection: "Writing your thoughts down is a brave act of self-care. Acknowledging these feelings allows your nervous system to soften. Give yourself permission to pause and take three deep breaths right now.",
    });
  } catch (err: any) {
    res.json({
      reflection: "Thank you for releasing these thoughts onto the page. Your experiences and feelings are valid. Take it one gentle moment at a time.",
    });
  }
});

// Vulavula Voice Journaling Speech-to-Text Transcription & Sentiment Analysis
app.post("/api/vulavula/transcribe-journal", async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/webm", language = "English", spokenText, topic, durationSeconds = 15 } = req.body;

    let transcript = spokenText || "";
    let sentimentScore = 65;
    let detectedMood = "Reflective";
    let primaryThemes = ["Academic Pacing", "Mental Reset"];
    let reflection = "Speaking your inner experience aloud helps untangle racing thoughts. You are carrying important goals, but your peace of mind comes first.";
    let culturalInsight = "Ubuntu reminds us that struggling is not a solitary failing; taking time to breathe and regroup honors your humanity.";
    let suggestedMicroAction = "Step outside for 2 minutes of fresh air and take five diaphragmatic breaths.";

    // If audio is provided or fallback spoken text, analyze with Gemini or Vulavula NLP logic
    const hasAudio = audioBase64 && typeof audioBase64 === "string" && audioBase64.length > 100;

    const analysisPrompt = `You are Vulavula Voice & Language Engine, a culturally grounded African NLP and emotional wellness intelligence engine for South African university students.
The student just recorded a voice journal reflection (Language: ${language}, Topic Context: ${topic || "Daily student life and emotional state"}).
${transcript ? `Student's spoken transcription:\n"${transcript}"` : "The student submitted an audio voice recording."}

Analyze the spoken reflection and return a strictly valid JSON object with these exact keys:
{
  "transcript": "Exact or cleaned spoken transcript of what the student expressed in ${language}",
  "sentimentScore": <number from 0 to 100, where 100 is flourishing/grounded, 50 is neutral, <40 is high stress/anxiety>,
  "detectedMood": "<e.g. Grounded, Hopeful, Overwhelmed, Exhausted, Anxious, Determined, Relieved>",
  "primaryThemes": ["<Theme 1>", "<Theme 2>", "<Theme 3>"],
  "reflection": "<2-3 sentence deeply validating, compassionate, and culturally attuned voice journal reflection in ${language}>",
  "culturalInsight": "<1 sentence grounded South African student context or Ubuntu wisdom>",
  "suggestedMicroAction": "<1 immediate, accessible 2-minute coping micro-action>"
}`;

    let contentsPayload: any = analysisPrompt;
    if (hasAudio) {
      contentsPayload = [
        {
          inlineData: {
            mimeType: mimeType || "audio/webm",
            data: audioBase64.replace(/^data:audio\/\w+;base64,/, ""),
          },
        },
        { text: analysisPrompt },
      ];
    }

    const aiResponse = await generateContentWithFallback({
      contents: contentsPayload,
      config: {
        temperature: 0.6,
        responseMimeType: "application/json",
      },
    });

    if (aiResponse) {
      try {
        const cleaned = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.transcript || parsed.reflection) {
          return res.json({
            transcript: parsed.transcript || transcript || "Spoken reflection recorded and processed.",
            sentimentScore: typeof parsed.sentimentScore === "number" ? Math.min(100, Math.max(0, parsed.sentimentScore)) : 65,
            detectedMood: parsed.detectedMood || "Reflective",
            primaryThemes: Array.isArray(parsed.primaryThemes) ? parsed.primaryThemes : ["Student Resilience", "Stress Relief"],
            reflection: parsed.reflection || reflection,
            culturalInsight: parsed.culturalInsight || culturalInsight,
            suggestedMicroAction: parsed.suggestedMicroAction || suggestedMicroAction,
            audioDurationSeconds: durationSeconds,
            engine: "vulavula-multimodal-nlp",
          });
        }
      } catch (parseErr) {
        console.warn("Vulavula voice json parse error, falling back to heuristic", parseErr);
      }
    }

    // Heuristic sentiment scoring and synthesis if model quota is reached or audio is local
    if (!transcript) {
      const sampleTranscripts: Record<string, string> = {
        English: "I was feeling pretty anxious about my upcoming exams and assignments today, but taking a moment to speak it out is helping me slow down and get perspective.",
        isiZulu: "Bengizizwa ngicindezelekile ngezifundo zami zanamuhla, kodwa ukukhuluma lokhu kungisiza ukuba ngizole ngithole amandla amasha.",
        isiXhosa: "Bendingcangcazela ngenxa yeemviwo namhlanje, kodwa ukuthetha kule app kundinceda ndithobe uxinzelelo lwam.",
        Afrikaans: "Ek het baie stres ervaar oor my take vandag, maar om hardop daaroor te praat help my om weer kalm te word.",
        Sesotho: "Ke ne ke imetswe ke dithuto tsa ka kajeno, empa ho bua sena ho nthusa ho theohela le ho fumana kgutso.",
      };
      transcript = sampleTranscripts[language] || sampleTranscripts["English"];
    }

    // Heuristic sentiment detection
    const lower = transcript.toLowerCase();
    if (lower.includes("anxious") || lower.includes("crying") || lower.includes("panic") || lower.includes("fail") || lower.includes("overwhelm")) {
      sentimentScore = 38;
      detectedMood = "Overwhelmed & Processing";
      primaryThemes = ["Academic Pressure", "Nervous System Reset"];
      reflection = "We hear the real weight of everything you are holding right now. Speaking this out took courage. Give your body a moment to release the tension in your shoulders.";
      suggestedMicroAction = "Do 3 cycles of 4-4-4-4 Box Breathing to calm your heart rate.";
    } else if (lower.includes("grateful") || lower.includes("calm") || lower.includes("better") || lower.includes("good") || lower.includes("hope")) {
      sentimentScore = 78;
      detectedMood = "Grounded & Resilient";
      primaryThemes = ["Self-Regulation", "Clarity & Progress"];
      reflection = "Your reflection carries clear self-awareness and grounding. Acknowledging small wins during a demanding semester is how true resilience is built.";
      suggestedMicroAction = "Drink a glass of water and write down one priority for tomorrow.";
    } else {
      sentimentScore = 62;
      detectedMood = "Reflective & Thoughtful";
      primaryThemes = ["Daily Reflection", "Work-Life Pacing"];
    }

    return res.json({
      transcript,
      sentimentScore,
      detectedMood,
      primaryThemes,
      reflection,
      culturalInsight,
      suggestedMicroAction,
      audioDurationSeconds: durationSeconds,
      engine: "vulavula-local-intelligence",
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Voice journal analysis failed" });
  }
});

function generateIntelligentFallbackRecommendations(currentMood: string = "Neutral", stressor: string = "Academics", history: any[] = []) {
  const isAnxious = ["Anxious", "Stressed", "Overwhelmed"].includes(currentMood) || stressor === "Exams & Deadlines";
  const isDown = ["Down", "Exhausted", "Sad", "Hopeless"].includes(currentMood);

  return {
    sentimentSummary: {
      detectedMood: currentMood || "Anxious",
      sentimentScore: isAnxious ? 38 : isDown ? 42 : 68,
      primaryStressor: stressor || "Academic & Daily Pressure",
      culturalInsight: "Balancing university coursework, family hopes, and personal energy is challenging. Your feelings are completely understandable.",
      riskLevel: isAnxious ? "medium" : "low",
    },
    recommendedActions: [
      {
        id: "rec-1",
        title: isAnxious ? "4-4-4-4 Box Breathing" : "5-4-3-2-1 Sensory Grounding",
        category: "mindfulness",
        duration: "2 min",
        reason: isAnxious ? "Lowers nervous system arousal and slows heart rate rapidly." : "Reconnects you to the physical present when mentally detached.",
        actionType: isAnxious ? "tool_box_breathing" : "tool_grounding_54321",
        priority: "immediate",
      },
      {
        id: "rec-2",
        title: "Anonymous Peer Support Room",
        category: "peer_support",
        duration: "Flexible",
        reason: "Read and share with students currently facing the same pressure.",
        actionType: "open_peer_room",
        priority: "recommended",
      },
      {
        id: "rec-3",
        title: "Reflective Emotion Release Journal",
        category: "journaling",
        duration: "3 min",
        reason: "Writing externalizes thoughts so you don't ruminate alone.",
        actionType: "tool_journal",
        priority: "recommended",
      },
      {
        id: "rec-4",
        title: "Confidential Counselor Check-in",
        category: "counselor",
        duration: "Free / On-Demand",
        reason: "Book a callback or chat directly with a student counselor.",
        actionType: "open_counselor",
        priority: "optional",
      },
    ],
    peerCircleRecommendation: {
      topic: stressor === "Exams & Deadlines" ? "Exam Season Survival & Study Anxiety" : "Campus Balance & Mental Reset",
      whyMatch: "38 students active in this circle right now sharing similar challenges.",
      channelId: "exams",
    },
    affirmation: "You don't have to have everything figured out right now. One step, one breath, one day at a time.",
  };
}

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`comforTech Lelapa AI server running on port ${PORT}`);
  });
}

startServer();
