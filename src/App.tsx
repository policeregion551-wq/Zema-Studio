import { Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { StudioStage } from "./components/StudioStage";
import { TopBar } from "./components/TopBar";
import {
  OUTPUT_LANGUAGES,
  TRANSLATIONS,
  UI_LANGUAGES,
} from "./i18n";
import type { CreationResult, ToolMode, UiLanguage } from "./types";
import { renderAdPosterPng } from "./utils/adVisualRenderer";
import { synthesizeMusicToWavUrl } from "./utils/musicSynth";
import {
  renderPhotoVideoToBlobUrl,
  renderTextVideoToBlobUrl,
} from "./utils/videoRenderer";

const TEN_MINUTES_MS = 10 * 60 * 1000;

const VOICE_OPTIONS = [
  { id: "Kore", label: "Kore (Warm)" },
  { id: "Puck", label: "Puck (Bright)" },
  { id: "Charon", label: "Charon (Deep)" },
  { id: "Fenrir", label: "Fenrir (Bold)" },
  { id: "Zephyr", label: "Zephyr (Calm)" },
];

function revokeCreationUrls(item: CreationResult) {
  if (item.audioDataUrl && item.audioDataUrl.startsWith("blob:")) {
    URL.revokeObjectURL(item.audioDataUrl);
  }
  if (item.videoDataUrl && item.videoDataUrl.startsWith("blob:")) {
    URL.revokeObjectURL(item.videoDataUrl);
  }
}

async function postApiJson<T>(url: string, body: unknown): Promise<T> {
  const configuredBase = (
    (import.meta.env.VITE_API_BASE_URL as string | undefined) || ""
  ).replace(/\/$/, "");
  const targetUrl = configuredBase ? `${configuredBase}${url}` : url;

  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const rawText = await res.text();
    const trimmed = rawText.trim();
    const isHtml =
      trimmed.startsWith("<!") ||
      trimmed.startsWith("<html") ||
      trimmed.startsWith("<HTML");

    if (isHtml || res.status === 404) {
      throw new Error(
        "API endpoint not found (404). If deployed on Vercel, ensure the `api/` folder and `vercel.json` are pushed and `GEMINI_API_KEY` is set in Vercel Environment Variables."
      );
    }

    let parsed: Record<string, unknown> = {};
    try {
      parsed = trimmed ? (JSON.parse(trimmed) as Record<string, unknown>) : {};
    } catch {
      if ((res.status === 503 || res.status === 504) && attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 1400 * (attempt + 1)));
        continue;
      }
      throw new Error(
        `Server returned an unexpected response (${res.status}). Please try again.`
      );
    }

    if (!res.ok) {
      if ((res.status === 503 || res.status === 504) && attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 1400 * (attempt + 1)));
        continue;
      }
      const msg =
        typeof parsed.error === "string"
          ? parsed.error
          : `Request failed (${res.status}).`;
      throw new Error(msg);
    }

    return parsed as T;
  }

  throw new Error("Request failed (503).");
}

export default function App() {
  const [lang, setLang] = useState<UiLanguage>("am");
  const [mode, setMode] = useState<ToolMode>("music");

  const t = TRANSLATIONS[lang];
  const langMeta = UI_LANGUAGES.find((l) => l.code === lang) ?? UI_LANGUAGES[0];

  // Shared prompt input
  const [prompt, setPrompt] = useState("");

  // Music options
  const [moodIdx, setMoodIdx] = useState(0);
  const [musicLength, setMusicLength] = useState<"clip" | "pro">("clip");
  const [vocalLanguage, setVocalLanguage] = useState("Instrumental");

  // Ad options
  const [adPlatformIdx, setAdPlatformIdx] = useState(0);
  const [adToneIdx, setAdToneIdx] = useState(0);
  const [adVoice, setAdVoice] = useState("Kore");
  const [adOutputLang, setAdOutputLang] = useState("Amharic");
  const [includeVisual, setIncludeVisual] = useState(true);

  // Video options
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [videoDuration, setVideoDuration] = useState("6s");

  // Photo upload for Photo-to-Video
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState("image/png");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Execution & Results
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<CreationResult | null>(
    null
  );
  const [history, setHistory] = useState<CreationResult[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = langMeta.dir;
    setAdOutputLang(langMeta.englishName);
  }, [lang, langMeta.dir, langMeta.englishName]);

  // 10-minute auto-expiry ticker & cleanup
  useEffect(() => {
    if (history.length === 0 && !currentResult) return;

    const timer = window.setInterval(() => {
      const now = Date.now();
      setNowMs(now);

      setHistory((prev) => {
        const expired = prev.filter((item) => item.expiresAt <= now);
        if (expired.length === 0) return prev;
        expired.forEach(revokeCreationUrls);
        return prev.filter((item) => item.expiresAt > now);
      });

      setCurrentResult((prev) => {
        if (!prev) return prev;
        if (prev.expiresAt <= now) {
          revokeCreationUrls(prev);
          return null;
        }
        return prev;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [history.length, currentResult]);

  const registerCreation = useCallback((item: CreationResult) => {
    const now = Date.now();
    setNowMs(now);
    setCurrentResult(item);
    // Any previous creations retain their 10-minute limit (and cap at 10 min from now)
    setHistory((prev) => {
      const updatedPrev = prev.map((old) => ({
        ...old,
        expiresAt: Math.min(old.expiresAt, now + TEN_MINUTES_MS),
      }));
      return [item, ...updatedPrev].slice(0, 10);
    });
  }, []);

  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) revokeCreationUrls(target);
      return prev.filter((i) => i.id !== id);
    });
    setCurrentResult((prev) => (prev?.id === id ? null : prev));
  };

  const handleModeChange = (nextMode: ToolMode) => {
    setMode(nextMode);
    setError(null);
  };

  const handlePhotoFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      setPhotoPreviewUrl(dataUrl);

      // Downscale for fast Vision API upload while keeping original for crisp video rendering
      const img = new Image();
      img.onload = () => {
        const maxDim = 1024;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setPhotoBase64(canvas.toDataURL("image/jpeg", 0.85));
          setPhotoMimeType("image/jpeg");
        } else {
          setPhotoBase64(dataUrl);
          setPhotoMimeType(file.type || "image/png");
        }
      };
      img.onerror = () => {
        setPhotoBase64(dataUrl);
        setPhotoMimeType(file.type || "image/png");
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const runGeneration = async () => {
    if (isLoading) return;

    if (mode === "photo-video" && !photoBase64) {
      setError(t.uploadTitle);
      return;
    }

    if (mode !== "photo-video" && !prompt.trim()) {
      setError(t.placeholders[mode]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const createdTimestamp = Date.now();
      const expiresAt = createdTimestamp + TEN_MINUTES_MS;
      const nowTime = new Date(createdTimestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (mode === "music") {
        const data = await postApiJson<{ score?: Record<string, unknown> }>(
          "/api/text-to-music",
          {
            prompt: prompt.trim(),
            mood: t.moods[moodIdx] || "Calm",
            durationMode: musicLength,
            vocalLanguage,
          }
        );
        const score = (data.score ?? {}) as {
          title?: string;
          scaleName?: string;
          bpm?: number;
          lyrics?: string;
        };
        const audioDataUrl = await synthesizeMusicToWavUrl(score);
        registerCreation({
          id: `${createdTimestamp}`,
          mode: "music",
          prompt: prompt.trim(),
          musicTitle: score.title,
          createdAt: nowTime,
          createdTimestamp,
          expiresAt,
          metaLabel: `${score.scaleName || "Studio"} · ${score.bpm || 96} BPM`,
          audioDataUrl,
          lyrics: score.lyrics,
        });
      } else if (mode === "ad") {
        const data = await postApiJson<{
          ad?: Record<string, unknown>;
          audioDataUrl?: string | null;
          audioWarning?: string | null;
        }>("/api/text-to-ad", {
          prompt: prompt.trim(),
          platform: t.adPlatforms[adPlatformIdx],
          tone: t.adTones[adToneIdx],
          outputLanguage: adOutputLang,
          voiceName: adVoice,
        });
        const adObj = (data.ad ?? {}) as CreationResult["ad"];
        const imageDataUrl = includeVisual
          ? renderAdPosterPng(adObj ?? {})
          : null;
        registerCreation({
          id: `${createdTimestamp}`,
          mode: "ad",
          prompt: prompt.trim(),
          createdAt: nowTime,
          createdTimestamp,
          expiresAt,
          metaLabel: `${adOutputLang} · ${adVoice}`,
          ad: adObj,
          audioDataUrl: data.audioDataUrl,
          audioWarning: data.audioWarning,
          imageDataUrl,
        });
      } else if (mode === "text-video") {
        const data = await postApiJson<{
          script?: { summary?: string };
        }>("/api/text-to-video", {
          prompt: prompt.trim(),
          aspectRatio,
          duration: videoDuration,
        });
        const script = data.script ?? {};
        const videoDataUrl = await renderTextVideoToBlobUrl(
          script,
          aspectRatio
        );
        registerCreation({
          id: `${createdTimestamp}`,
          mode: "text-video",
          prompt: prompt.trim(),
          createdAt: nowTime,
          createdTimestamp,
          expiresAt,
          metaLabel: `${aspectRatio} · ${videoDuration}`,
          videoDataUrl,
          enhancedPrompt: script.summary,
        });
      } else if (mode === "photo-video") {
        const data = await postApiJson<{
          choreography?: { summary?: string };
        }>("/api/photo-to-video", {
          imageBase64: photoBase64,
          mimeType: photoMimeType,
          motionPrompt: prompt.trim(),
          duration: videoDuration,
        });
        const choreography = data.choreography ?? {};
        const videoDataUrl = await renderPhotoVideoToBlobUrl(
          photoPreviewUrl!,
          choreography,
          aspectRatio,
          videoDuration
        );
        registerCreation({
          id: `${createdTimestamp}`,
          mode: "photo-video",
          prompt: prompt.trim() || "Photo animation",
          createdAt: nowTime,
          createdTimestamp,
          expiresAt,
          metaLabel: `${aspectRatio} · ${videoDuration}`,
          videoDataUrl,
          enhancedPrompt: choreography.summary,
        });
      }
    } catch (err) {
      const rawMsg =
        err instanceof Error ? err.message : "Network error while generating.";
      const lower = rawMsg.toLowerCase();
      if (
        lower.includes("high demand") ||
        lower.includes("unavailable") ||
        lower.includes("503") ||
        lower.includes("timed out")
      ) {
        setError(t.highDemandError);
      } else {
        setError(rawMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    void runGeneration();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827]">
      <TopBar
        mode={mode}
        onModeChange={handleModeChange}
        lang={lang}
        onLangChange={setLang}
        t={t}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Simple Input Composer */}
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight text-balance">
                {t.titles[mode]}
              </h1>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                {t.subtitles[mode]}
              </p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {mode === "photo-video" && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoFile(f);
                    }}
                  />
                  {photoPreviewUrl ? (
                    <div className="space-y-2.5">
                      <img
                        src={photoPreviewUrl}
                        alt="Uploaded preview"
                        className="w-full h-44 object-cover rounded-xl border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-medium text-blue-700 hover:text-blue-800 cursor-pointer"
                      >
                        {t.changePhoto}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const f = e.dataTransfer.files?.[0];
                        if (f) handlePhotoFile(f);
                      }}
                      className="w-full py-8 px-4 border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-xl bg-slate-50 hover:bg-blue-50/30 transition-colors flex flex-col items-center justify-center text-center cursor-pointer"
                    >
                      <Upload className="w-6 h-6 text-slate-400 mb-2" />
                      <span className="text-sm font-medium text-slate-800">
                        {t.uploadTitle}
                      </span>
                      <span className="text-xs text-slate-500 mt-1">
                        {t.uploadHint}
                      </span>
                    </button>
                  )}
                </div>
              )}

              <div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder={t.placeholders[mode]}
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-y"
                />

                <div className="mt-2.5">
                  <span className="text-xs font-medium text-slate-500 block mb-1.5">
                    {t.examplesLabel}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {t.examples[mode].map((ex, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPrompt(ex)}
                        className="text-start text-xs text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 rounded-lg px-3 py-2 transition-colors truncate cursor-pointer"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {mode === "music" && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-xs font-medium text-slate-600 block mb-2">
                      {t.moodLabel}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {t.moods.map((m, idx) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMoodIdx(idx)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                            moodIdx === idx
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs font-medium text-slate-600 block mb-1.5">
                        {t.musicLengthLabel}
                      </span>
                      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setMusicLength("clip")}
                          className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                            musicLength === "clip"
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-600"
                          }`}
                        >
                          {t.musicShort}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMusicLength("pro")}
                          className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                            musicLength === "pro"
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-600"
                          }`}
                        >
                          {t.musicFull}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="vocal-lang-select"
                        className="text-xs font-medium text-slate-600 block mb-1.5"
                      >
                        {t.vocalLangLabel}
                      </label>
                      <select
                        id="vocal-lang-select"
                        value={vocalLanguage}
                        onChange={(e) => setVocalLanguage(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="Instrumental">{t.instrumental}</option>
                        {OUTPUT_LANGUAGES.map((l) => (
                          <option key={l.value} value={l.value}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {mode === "ad" && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="ad-lang-select"
                        className="text-xs font-medium text-slate-600 block mb-1.5"
                      >
                        {t.adOutputLangLabel}
                      </label>
                      <select
                        id="ad-lang-select"
                        value={adOutputLang}
                        onChange={(e) => setAdOutputLang(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {OUTPUT_LANGUAGES.map((l) => (
                          <option key={l.value} value={l.value}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="ad-voice-select"
                        className="text-xs font-medium text-slate-600 block mb-1.5"
                      >
                        {t.adVoiceLabel}
                      </label>
                      <select
                        id="ad-voice-select"
                        value={adVoice}
                        onChange={(e) => setAdVoice(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {VOICE_OPTIONS.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="ad-platform-select"
                        className="text-xs font-medium text-slate-600 block mb-1.5"
                      >
                        {t.adPlatformLabel}
                      </label>
                      <select
                        id="ad-platform-select"
                        value={adPlatformIdx}
                        onChange={(e) => setAdPlatformIdx(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {t.adPlatforms.map((p, idx) => (
                          <option key={p} value={idx}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="ad-tone-select"
                        className="text-xs font-medium text-slate-600 block mb-1.5"
                      >
                        {t.adToneLabel}
                      </label>
                      <select
                        id="ad-tone-select"
                        value={adToneIdx}
                        onChange={(e) => setAdToneIdx(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {t.adTones.map((tone, idx) => (
                          <option key={tone} value={idx}>
                            {tone}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeVisual}
                      onChange={(e) => setIncludeVisual(e.target.checked)}
                      className="w-4 h-4 accent-blue-700 rounded cursor-pointer"
                    />
                    <span>{t.includeVisualLabel}</span>
                  </label>
                </div>
              )}

              {(mode === "text-video" || mode === "photo-video") && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-xs font-medium text-slate-600 block mb-1.5">
                      {t.aspectRatioLabel}
                    </span>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setAspectRatio("16:9")}
                        className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          aspectRatio === "16:9"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600"
                        }`}
                      >
                        {t.landscapeLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAspectRatio("9:16")}
                        className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          aspectRatio === "9:16"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600"
                        }`}
                      >
                        {t.portraitLabel}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-slate-600 block mb-1.5">
                      {t.videoDurationLabel}
                    </span>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                      {["4s", "6s", "8s"].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setVideoDuration(d)}
                          className={`py-1.5 text-xs font-mono tabular-nums font-medium rounded-md transition-colors cursor-pointer ${
                            videoDuration === d
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-600"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                {isLoading ? t.generatingBtn : t.generateBtn[mode]}
              </button>
            </form>
          </section>

          {/* Right Column: Result & Library Stage */}
          <div className="lg:col-span-7">
            <StudioStage
              mode={mode}
              isLoading={isLoading}
              error={error}
              result={currentResult}
              history={history}
              nowMs={nowMs}
              onSelectHistory={(item) => {
                setMode(item.mode);
                setCurrentResult(item);
                setError(null);
              }}
              onDeleteHistory={handleDeleteHistory}
              onRetry={() => void runGeneration()}
              t={t}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
