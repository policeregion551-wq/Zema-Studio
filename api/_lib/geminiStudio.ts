import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

export interface HttpReqLike {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

export interface HttpResLike {
  status: (code: number) => HttpResLike;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

export function applyCors(req: HttpReqLike, res: HttpResLike): boolean {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

export function parseBody<T extends Record<string, unknown>>(req: HttpReqLike): T {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return {} as T;
    }
  }
  if (req.body && typeof req.body === "object") {
    return req.body as T;
  }
  return {} as T;
}

export function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error(
        "GEMINI_API_KEY is missing. Add GEMINI_API_KEY in Vercel Environment Variables (or Settings > Secrets) and redeploy."
      ),
      { status: 400 }
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

export function parseApiError(err: unknown): { status: number; message: string } {
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

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        Object.assign(new Error(`${label} timed out. Please try again.`), {
          status: 504,
        })
      );
    }, ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function generateWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: unknown;
    systemInstruction: string;
    responseSchema: Record<string, unknown>;
  }
): Promise<string> {
  const attempts: Array<{
    model: string;
    thinkingLevel?: ThinkingLevel;
  }> = [
    { model: "gemini-4-hydrogen", thinkingLevel: ThinkingLevel.LOW },
    { model: "gemini-3.1-flash-lite", thinkingLevel: ThinkingLevel.MINIMAL },
    { model: "gemini-3.8-flash" },
  ];

  let lastErr: unknown;
  for (let i = 0; i < attempts.length; i++) {
    const { model, thinkingLevel } = attempts[i];
    try {
      const config: Record<string, unknown> = {
        systemInstruction: params.systemInstruction,
        responseMimeType: "application/json",
        responseSchema: params.responseSchema,
      };
      if (thinkingLevel) {
        config.thinkingConfig = { thinkingLevel };
      }
      const res = await withTimeout(
        ai.models.generateContent({
          model,
          contents: params.contents as Parameters<
            typeof ai.models.generateContent
          >[0]["contents"],
          config,
        }),
        12000,
        model
      );
      return (res.text ?? "{}").trim();
    } catch (err) {
      lastErr = err;
      const { status } = parseApiError(err);
      const canFallback = isRetryableError(err) || status === 404 || status === 504;
      if (!canFallback || i === attempts.length - 1) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  throw lastErr;
}

export async function handleTextToMusic(body: Record<string, unknown>) {
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const mood = typeof body.mood === "string" ? body.mood : "Calm";
  const durationMode = body.durationMode === "pro" ? "pro" : "clip";
  const vocalLanguage =
    typeof body.vocalLanguage === "string"
      ? body.vocalLanguage
      : "Instrumental";

  if (!prompt) {
    throw Object.assign(new Error("Please enter a music description."), {
      status: 400,
    });
  }

  const ai = getAiClient();
  const targetSeconds = durationMode === "pro" ? 28 : 16;

  const scoreJsonText = await generateWithFallback(ai, {
    contents: `Compose a complete musical arrangement for this request:
"${prompt}"
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

  const score = JSON.parse(scoreJsonText || "{}");
  return { score };
}

export async function handleTextToAd(body: Record<string, unknown>) {
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const platform =
    typeof body.platform === "string" ? body.platform : "TikTok / Reels";
  const tone =
    typeof body.tone === "string" ? body.tone : "Warm & Persuasive";
  const outputLanguage =
    typeof body.outputLanguage === "string" ? body.outputLanguage : "Amharic";
  const voiceName =
    typeof body.voiceName === "string" ? body.voiceName : "Kore";

  if (!prompt) {
    throw Object.assign(new Error("Please describe your product or offer."), {
      status: 400,
    });
  }

  const ai = getAiClient();

  const adJsonText = await generateWithFallback(ai, {
    contents: `Create a high-converting advertisement package for:\n"${prompt}"\n\nTarget Platform: ${platform}\nTone: ${tone}\nOutput Language for all customer-facing copy (headline, subheadline, voiceoverScript, socialCaption, callToAction, overlayText): ${outputLanguage}`,
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

  const adJson = JSON.parse(adJsonText || "{}") as {
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
    const validVoices = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"];
    const chosenVoice = validVoices.includes(voiceName) ? voiceName : "Kore";

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
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
          audioWarning = null;
          break;
        }
      } catch (ttsErr) {
        audioWarning = parseApiError(ttsErr).message;
        if (!isRetryableError(ttsErr) || attempt === 2) {
          break;
        }
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  return {
    ad: adJson,
    audioDataUrl,
    audioWarning,
  };
}

export async function handleTextToVideo(body: Record<string, unknown>) {
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const aspectRatio = body.aspectRatio === "9:16" ? "9:16" : "16:9";
  const duration = body.duration ?? "6s";

  if (!prompt) {
    throw Object.assign(new Error("Please enter a video scene description."), {
      status: 400,
    });
  }

  const ai = getAiClient();
  const totalSec = Math.max(4, Math.min(10, parseInt(String(duration), 10) || 6));

  const directorJsonText = await generateWithFallback(ai, {
    contents: `Direct a ${totalSec}-second animated short video (${aspectRatio}) for:\n"${prompt}"`,
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

  const script = JSON.parse(directorJsonText || "{}");
  return { script };
}

export async function handlePhotoToVideo(body: Record<string, unknown>) {
  const imageBase64 =
    typeof body.imageBase64 === "string" ? body.imageBase64 : "";
  const mimeType =
    typeof body.mimeType === "string" ? body.mimeType : "image/png";
  const motionPrompt =
    typeof body.motionPrompt === "string" ? body.motionPrompt.trim() : "";
  const duration = body.duration ?? "6s";

  if (!imageBase64) {
    throw Object.assign(new Error("Please upload a photo first."), {
      status: 400,
    });
  }

  const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
  const ai = getAiClient();
  const totalSec = Math.max(4, Math.min(10, parseInt(String(duration), 10) || 6));

  const visionJsonText = await generateWithFallback(ai, {
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        {
          text: `Analyze this photo and the user's animation request ("${motionPrompt || "Natural cinematic motion"}") to plan a ${totalSec}-second photo animation.`,
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

  const choreography = JSON.parse(visionJsonText || "{}");
  return { choreography };
}
