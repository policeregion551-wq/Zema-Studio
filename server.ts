import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error("GEMINI_API_KEY is not configured in Settings > Secrets."),
      { status: 400, code: "API_KEY_MISSING" }
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function parseApiError(err: unknown): { status: number; message: string } {
  const rawMessage =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : JSON.stringify(err);

  let cleanMessage = rawMessage;
  try {
    const parsed = JSON.parse(rawMessage);
    if (parsed?.error?.message) {
      cleanMessage = String(parsed.error.message);
    }
  } catch {
    // Keep rawMessage
  }

  const statusMatch = rawMessage.match(/\b(400|401|403|404|429|500|503)\b/);
  const statusFromErr =
    typeof (err as { status?: unknown })?.status === "number"
      ? (err as { status: number }).status
      : statusMatch
        ? Number(statusMatch[1])
        : 500;

  return {
    status: statusFromErr >= 400 && statusFromErr < 600 ? statusFromErr : 500,
    message: cleanMessage,
  };
}

function isRetryableError(err: unknown): boolean {
  const { status, message } = parseApiError(err);
  const lower = message.toLowerCase();
  return (
    status === 503 ||
    status === 500 ||
    status === 429 ||
    lower.includes("unavailable") ||
    lower.includes("high demand") ||
    lower.includes("try again")
  );
}

async function generateWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: unknown;
    systemInstruction: string;
    responseSchema: Record<string, unknown>;
  }
) {
  const attempts: Array<{
    model: string;
    thinkingLevel: ThinkingLevel;
  }> = [
    { model: "gemini-4-hydrogen", thinkingLevel: ThinkingLevel.LOW },
    { model: "gemini-3.1-flash-lite", thinkingLevel: ThinkingLevel.MINIMAL },
    { model: "gemini-3.1-flash-lite", thinkingLevel: ThinkingLevel.MINIMAL },
  ];

  let lastErr: unknown;
  for (let i = 0; i < attempts.length; i++) {
    const { model, thinkingLevel } = attempts[i];
    try {
      return await ai.models.generateContent({
        model,
        contents: params.contents as Parameters<
          typeof ai.models.generateContent
        >[0]["contents"],
        config: {
          systemInstruction: params.systemInstruction,
          thinkingConfig: { thinkingLevel },
          responseMimeType: "application/json",
          responseSchema: params.responseSchema,
        },
      });
    } catch (err) {
      lastErr = err;
      if (!isRetryableError(err) || i === attempts.length - 1) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw lastErr;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "25mb" }));

  app.use("/api", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // 1. Free Text to Music (AI Composer -> Client Studio Synth)
  app.post("/api/text-to-music", async (req, res) => {
    try {
      const {
        prompt,
        mood = "Calm",
        durationMode = "clip",
        vocalLanguage = "Instrumental",
      } = req.body ?? {};

      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        res.status(400).json({ error: "Please enter a music description." });
        return;
      }

      const ai = getAiClient();
      const targetSeconds = durationMode === "pro" ? 28 : 16;

      const compositionResponse = await generateWithFallback(ai, {
        contents: `Compose a complete musical arrangement for this request:
"${prompt.trim()}"
Mood: ${mood}
Target Duration: ${targetSeconds} seconds
Lyrics Language (if applicable, write short poetic verses/chorus in this language, or short poetic notes if Instrumental): ${vocalLanguage}`,
        systemInstruction: `You are an expert music composer (skilled in Ethiopian pentatonic modes like Tizita, Bati, Ambassel, Anchihoye as well as global Jazz, Lo-Fi, Afrobeat, Classical, and Pop).
Return a structured, genuinely musical composition in JSON:
- title: concise song title
- scaleName: e.g. "Tizita Major", "Bati Minor", "C Major", "A Minor", "Dorian"
- bpm: integer between 68 and 136 matching the mood
- instrument: one of "krar", "piano", "pad", "marimba", "guitar", "brass"
- drumStyle: one of "none", "soft", "groove", "afro"
- durationSeconds: ${targetSeconds}
- chords: array of 4 to 8 chord objects, each with "notes" (array of 3-4 MIDI note numbers in range 48..72) and "bassNote" (MIDI note in range 36..48)
- melody: array of 16 to 32 melodic note events across the loop, each with:
  - step: integer 0..31 (8th-note grid position within a 32-step loop)
  - midi: integer MIDI pitch (55..84) that harmonizes cleanly with the scale and chords
  - lengthSteps: integer 1..6
  - velocity: number 0.4..0.95
- lyrics: short poetic lyrics or musical liner notes matching the user's requested language (${vocalLanguage === "Instrumental" ? "match the user's prompt language" : vocalLanguage}).`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            scaleName: { type: Type.STRING },
            bpm: { type: Type.INTEGER },
            instrument: { type: Type.STRING },
            drumStyle: { type: Type.STRING },
            durationSeconds: { type: Type.INTEGER },
            lyrics: { type: Type.STRING },
            chords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bassNote: { type: Type.INTEGER },
                  notes: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                  },
                },
              },
            },
            melody: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.INTEGER },
                  midi: { type: Type.INTEGER },
                  lengthSteps: { type: Type.INTEGER },
                  velocity: { type: Type.NUMBER },
                },
              },
            },
          },
        },
      });

      const score = JSON.parse((compositionResponse.text ?? "{}").trim());
      res.json({ score });
    } catch (err) {
      const parsed = parseApiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  // 2. Free Text to Advertisement (Copy + Voiceover TTS)
  app.post("/api/text-to-ad", async (req, res) => {
    try {
      const {
        prompt,
        platform = "TikTok / Reels",
        tone = "Warm & Persuasive",
        outputLanguage = "Amharic",
        voiceName = "Kore",
      } = req.body ?? {};

      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        res.status(400).json({ error: "Please describe your product or offer." });
        return;
      }

      const ai = getAiClient();

      const adResponse = await generateWithFallback(ai, {
        contents: `Create a high-converting advertisement package for:\n"${prompt.trim()}"\n\nTarget Platform: ${platform}\nTone: ${tone}\nOutput Language for all customer-facing copy (headline, subheadline, voiceoverScript, socialCaption, callToAction, overlayText): ${outputLanguage}`,
        systemInstruction:
          "You are a world-class multilingual creative advertising director. Write natural, persuasive copy in the exact requested Output Language. Keep voiceoverScript spoken, rhythmic, and 25-45 words long. Also return a tasteful brand color palette (bgHex dark or light, accentHex, textHex) for the ad poster.",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            subheadline: { type: Type.STRING },
            voiceoverScript: { type: Type.STRING },
            socialCaption: { type: Type.STRING },
            callToAction: { type: Type.STRING },
            bgHex: { type: Type.STRING },
            accentHex: { type: Type.STRING },
            textHex: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  visual: { type: Type.STRING },
                  overlayText: { type: Type.STRING },
                },
              },
            },
          },
        },
      });

      const adJson = JSON.parse((adResponse.text ?? "{}").trim()) as {
        headline?: string;
        subheadline?: string;
        voiceoverScript?: string;
        socialCaption?: string;
        callToAction?: string;
        bgHex?: string;
        accentHex?: string;
        textHex?: string;
        scenes?: Array<{ time?: string; visual?: string; overlayText?: string }>;
      };

      let audioDataUrl: string | null = null;
      let audioWarning: string | null = null;

      if (adJson.voiceoverScript) {
        try {
          const validVoices = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"];
          const chosenVoice = validVoices.includes(voiceName)
            ? voiceName
            : "Kore";

          const ttsResponse = await ai.models.generateContent({
            model: "gemini-3.8-flash-lite-tts",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: adJson.voiceoverScript,
                    speechMetadata: {
                      style: `${tone} commercial voiceover`,
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: chosenVoice },
                },
              },
            },
          });

          const base64Audio =
            ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            audioDataUrl = `data:audio/wav;base64,${base64Audio}`;
          }
        } catch (ttsErr) {
          audioWarning = parseApiError(ttsErr).message;
        }
      }

      res.json({
        ad: adJson,
        audioDataUrl,
        audioWarning,
      });
    } catch (err) {
      const parsed = parseApiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  // 3. Free Text to Video (AI Scene Director -> Client Canvas Video Renderer)
  app.post("/api/text-to-video", async (req, res) => {
    try {
      const {
        prompt,
        aspectRatio = "16:9",
        duration = "6s",
      } = req.body ?? {};

      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        res.status(400).json({ error: "Please enter a video scene description." });
        return;
      }

      const ai = getAiClient();
      const totalSec = Math.max(4, Math.min(10, parseInt(String(duration), 10) || 6));

      const directorResponse = await generateWithFallback(ai, {
        contents: `Direct a ${totalSec}-second animated short video (${aspectRatio}) for:\n"${prompt.trim()}"`,
        systemInstruction: `You are a visual motion-graphics director. Break the user's scene into 3 sequential animated scenes totaling ${totalSec} seconds.
Return JSON:
- summary: concise 1-sentence English visual summary
- scenes: array of 3 scene objects, each with:
  - durationSec: number (sum roughly equals ${totalSec})
  - sceneType: one of "mountains", "city", "ocean", "coffee", "forest", "desert", "abstract"
  - skyTop: hex color string (e.g. "#0F172A")
  - skyBottom: hex color string (e.g. "#EA580C")
  - groundColor: hex color string
  - accentColor: hex color string
  - weather: one of "sunbeams", "rain", "stars", "petals", "steam", "none"
  - cameraMove: one of "zoom-in", "zoom-out", "pan-left", "pan-right"
  - caption: short 3-7 word subtitle in the SAME language as the user's prompt`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  durationSec: { type: Type.NUMBER },
                  sceneType: { type: Type.STRING },
                  skyTop: { type: Type.STRING },
                  skyBottom: { type: Type.STRING },
                  groundColor: { type: Type.STRING },
                  accentColor: { type: Type.STRING },
                  weather: { type: Type.STRING },
                  cameraMove: { type: Type.STRING },
                  caption: { type: Type.STRING },
                },
              },
            },
          },
        },
      });

      const script = JSON.parse((directorResponse.text ?? "{}").trim());
      res.json({ script });
    } catch (err) {
      const parsed = parseApiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  // 4. Free Photo to Video (Multimodal Vision Choreography -> Client Animator)
  app.post("/api/photo-to-video", async (req, res) => {
    try {
      const {
        imageBase64,
        mimeType = "image/png",
        motionPrompt = "",
        duration = "6s",
      } = req.body ?? {};

      if (!imageBase64 || typeof imageBase64 !== "string") {
        res.status(400).json({ error: "Please upload a photo first." });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
      const ai = getAiClient();
      const totalSec = Math.max(4, Math.min(10, parseInt(String(duration), 10) || 6));

      const visionResponse = await generateWithFallback(ai, {
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: `Analyze this photo and the user's animation request ("${motionPrompt.trim() || "Natural cinematic motion"}") to plan a ${totalSec}-second photo animation.`,
            },
          ],
        },
        systemInstruction: `You are a cinematographer planning a smooth Ken Burns + atmospheric particle animation for a still photograph.
Return JSON:
- summary: concise 1-sentence description of the camera & atmosphere motion
- zoomStart: number between 1.0 and 1.15
- zoomEnd: number between 1.05 and 1.32
- panX: number between -0.08 and 0.08 (fraction of frame width)
- panY: number between -0.06 and 0.06 (fraction of frame height)
- atmosphere: one of "sunbeams", "dust-motes", "rain", "petals", "stars", "warm-glow", "none"
- caption: optional short 2-6 word poetic caption matching user's language if they wrote a prompt, or empty string ""`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            zoomStart: { type: Type.NUMBER },
            zoomEnd: { type: Type.NUMBER },
            panX: { type: Type.NUMBER },
            panY: { type: Type.NUMBER },
            atmosphere: { type: Type.STRING },
            caption: { type: Type.STRING },
          },
        },
      });

      const choreography = JSON.parse((visionResponse.text ?? "{}").trim());
      res.json({ choreography });
    } catch (err) {
      const parsed = parseApiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  // Ensure /api/* routes always respond with JSON (never HTML)
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found." });
  });

  // Express JSON error handler for body-parser / unexpected errors
  app.use(
    (
      err: unknown,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (req.path.startsWith("/api")) {
        const parsed = parseApiError(err);
        res.status(parsed.status).json({ error: parsed.message });
        return;
      }
      next(err);
    }
  );

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      const indexPath = path.join(distDir, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Not found");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
