import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Film,
  Image as ImageIcon,
  Megaphone,
  Music,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { TranslationBundle } from "../i18n";
import type { CreationResult, ToolMode } from "../types";
import { AudioPlayer } from "./AudioPlayer";

interface StudioStageProps {
  mode: ToolMode;
  isLoading: boolean;
  error: string | null;
  result: CreationResult | null;
  history: CreationResult[];
  nowMs: number;
  onSelectHistory: (item: CreationResult) => void;
  onDeleteHistory: (id: string) => void;
  t: TranslationBundle;
}

function ModeIcon({ mode }: { mode: ToolMode }) {
  if (mode === "music") return <Music className="w-5 h-5 text-slate-400" />;
  if (mode === "ad") return <Megaphone className="w-5 h-5 text-slate-400" />;
  if (mode === "text-video")
    return <Film className="w-5 h-5 text-slate-400" />;
  return <ImageIcon className="w-5 h-5 text-slate-400" />;
}

function formatRemaining(expiresAt: number, nowMs: number): string {
  const remainingSec = Math.max(0, Math.ceil((expiresAt - nowMs) / 1000));
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function StudioStage({
  mode,
  isLoading,
  error,
  result,
  history,
  nowMs,
  onSelectHistory,
  onDeleteHistory,
  t,
}: StudioStageProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setElapsedSeconds(0);
      return;
    }
    const started = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - started) / 1000));
    }, 500);
    return () => window.clearInterval(timer);
  }, [isLoading]);

  const handleCopy = async (field: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-6 min-h-[420px] flex flex-col justify-between">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="w-12 h-12 rounded-full border-2 border-slate-200 border-t-blue-700 animate-spin mb-5" />
            <p className="text-base font-semibold text-slate-900">
              {t.generatingBtn}
            </p>
            <p className="text-sm text-slate-500 mt-1 font-mono tabular-nums">
              {elapsedSeconds}s
            </p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 px-4">
            <div className="max-w-lg w-full p-5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5 min-w-0">
                  <p className="text-sm text-slate-800 leading-relaxed break-words">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : !result ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-14 px-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
              <ModeIcon mode={mode} />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              {t.emptyStageTitle}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm leading-relaxed">
              {t.emptyStageDesc}
            </p>
            <p className="text-xs text-slate-400 mt-4 max-w-md leading-relaxed">
              {t.autoDeleteNotice}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="min-w-0">
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                  <span>{t.nav[result.mode]}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{result.metaLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-slate-600">
                    {t.expiresPrefix} {formatRemaining(result.expiresAt, nowMs)}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-900 truncate mt-1">
                  {result.musicTitle || result.prompt}
                </p>
              </div>
            </div>

            {/* 1. Music Result */}
            {result.mode === "music" && result.audioDataUrl && (
              <div className="space-y-5">
                <AudioPlayer
                  src={result.audioDataUrl}
                  downloadName="zema-music.wav"
                  downloadLabel={t.download}
                />

                {result.lyrics && (
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {t.lyricsTitle}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleCopy("lyrics", result.lyrics ?? "")}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        {copiedField === "lyrics" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedField === "lyrics" ? t.copied : t.copyText}
                        </span>
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                      {result.lyrics}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* 2. Advertisement Result */}
            {result.mode === "ad" && result.ad && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900 leading-snug">
                    {result.ad.headline}
                  </h3>
                  {result.ad.subheadline && (
                    <p className="text-base text-slate-600 leading-relaxed">
                      {result.ad.subheadline}
                    </p>
                  )}
                  {result.ad.callToAction && (
                    <p className="text-sm font-semibold text-blue-700 pt-1">
                      {result.ad.callToAction}
                    </p>
                  )}
                </div>

                {result.imageDataUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {t.adVisualTitle}
                      </h4>
                      <a
                        href={result.imageDataUrl}
                        download="ad-poster.png"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t.download}</span>
                      </a>
                    </div>
                    <img
                      src={result.imageDataUrl}
                      alt={result.ad.headline || "Advertisement poster"}
                      referrerPolicy="no-referrer"
                      className="w-full aspect-video object-cover rounded-xl border border-slate-200"
                    />
                  </div>
                )}

                {result.ad.voiceoverScript && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {t.voiceoverTitle}
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy("vo", result.ad?.voiceoverScript ?? "")
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        {copiedField === "vo" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedField === "vo" ? t.copied : t.copyText}
                        </span>
                      </button>
                    </div>

                    {result.audioDataUrl && (
                      <AudioPlayer
                        src={result.audioDataUrl}
                        downloadName="ad-voiceover.wav"
                        downloadLabel={t.download}
                      />
                    )}

                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                      {result.ad.voiceoverScript}
                    </p>
                  </div>
                )}

                {result.ad.scenes && result.ad.scenes.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {t.storyboardTitle}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {result.ad.scenes.map((scene, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                        >
                          <div className="text-xs font-mono tabular-nums text-slate-500">
                            {scene.time || `0${idx + 1}`}
                          </div>
                          {scene.overlayText && (
                            <p className="text-sm font-semibold text-slate-900">
                              {scene.overlayText}
                            </p>
                          )}
                          {scene.visual && (
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {scene.visual}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.ad.socialCaption && (
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {t.socialCaptionTitle}
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            "caption",
                            result.ad?.socialCaption ?? ""
                          )
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        {copiedField === "caption" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedField === "caption" ? t.copied : t.copyText}
                        </span>
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {result.ad.socialCaption}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. Video Result (Text-to-Video or Photo-to-Video) */}
            {(result.mode === "text-video" || result.mode === "photo-video") &&
              result.videoDataUrl && (
                <div className="space-y-4">
                  <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-200">
                    <video
                      src={result.videoDataUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="w-full max-h-[460px] mx-auto"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-slate-500 truncate">
                      {result.enhancedPrompt}
                    </p>
                    <a
                      href={result.videoDataUrl}
                      download="zema-video.webm"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t.download}</span>
                    </a>
                  </div>
                </div>
              )}

            <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
              {t.autoDeleteNotice}
            </p>
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {t.recentTitle}
            </h3>
            <span className="text-xs text-slate-500">{t.autoDeleteNotice}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {history.map((item) => {
              const selected = result?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`py-2.5 px-3 rounded-lg flex items-center justify-between gap-3 transition-colors ${
                    selected ? "bg-blue-50/70" : "hover:bg-slate-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectHistory(item)}
                    className="flex-1 min-w-0 text-start cursor-pointer"
                  >
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>{t.nav[item.mode]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{item.createdAt}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-600">
                        {formatRemaining(item.expiresAt, nowMs)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate mt-0.5">
                      {item.musicTitle || item.prompt}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteHistory(item.id)}
                    aria-label={t.removeLabel}
                    title={t.removeLabel}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
