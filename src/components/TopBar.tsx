import { Globe } from "lucide-react";
import { UI_LANGUAGES, type TranslationBundle } from "../i18n";
import type { ToolMode, UiLanguage } from "../types";

interface TopBarProps {
  mode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  lang: UiLanguage;
  onLangChange: (lang: UiLanguage) => void;
  t: TranslationBundle;
}

const TOOL_MODES: ToolMode[] = ["music", "ad", "text-video", "photo-video"];

export function TopBar({
  mode,
  onModeChange,
  lang,
  onLangChange,
  t,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onModeChange("music")}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          {t.brandName}
        </button>

        {/* Zone 2: 4 Single-line Tool Navigation Links */}
        <nav
          aria-label="Studio tools"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {TOOL_MODES.map((item) => {
            const active = mode === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onModeChange(item)}
                className={`py-2 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  active
                    ? "border-blue-700 text-blue-700 font-semibold"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                {t.nav[item]}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Language Switcher */}
        <div className="flex items-center shrink-0">
          <label htmlFor="ui-language-select" className="sr-only">
            Language
          </label>
          <div className="relative flex items-center">
            <Globe
              className="w-4 h-4 text-slate-500 absolute start-3 pointer-events-none"
              aria-hidden="true"
            />
            <select
              id="ui-language-select"
              value={lang}
              onChange={(e) => onLangChange(e.target.value as UiLanguage)}
              className="ps-9 pe-7 py-2 text-sm font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {UI_LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile tool tabs */}
      <div className="md:hidden border-t border-slate-100 bg-white overflow-x-auto">
        <div className="flex items-center gap-2 px-4 py-2 min-w-max">
          {TOOL_MODES.map((item) => {
            const active = mode === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onModeChange(item)}
                className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? "bg-blue-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t.nav[item]}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
