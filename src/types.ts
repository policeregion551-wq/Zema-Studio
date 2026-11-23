export type ToolMode = "music" | "ad" | "text-video" | "photo-video";

export type UiLanguage = "am" | "en" | "om" | "ti" | "ar" | "fr";

export interface AdScene {
  time?: string;
  visual?: string;
  overlayText?: string;
}

export interface AdContent {
  headline?: string;
  subheadline?: string;
  voiceoverScript?: string;
  socialCaption?: string;
  callToAction?: string;
  bgHex?: string;
  accentHex?: string;
  textHex?: string;
  scenes?: AdScene[];
}

export interface CreationResult {
  id: string;
  mode: ToolMode;
  prompt: string;
  createdAt: string;
  createdTimestamp: number;
  expiresAt: number;
  metaLabel: string;
  // Music
  audioDataUrl?: string | null;
  musicTitle?: string;
  lyrics?: string;
  // Ad
  ad?: AdContent;
  imageDataUrl?: string | null;
  audioWarning?: string | null;
  // Video
  videoDataUrl?: string | null;
  enhancedPrompt?: string;
}
