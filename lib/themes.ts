export type Theme = {
  key: string;
  label: string;
  pageBg: string; // public page background
  accentBg: string; // solid accent (buttons)
  accentBgHover: string;
  accentText: string; // text on accent
  accentSoft: string; // soft tinted background
  accentBorder: string;
  accentTextColor: string; // accent-colored text
  ring: string;
  swatch: string; // settings swatch
};

export const THEMES: Record<string, Theme> = {
  rose: {
    key: "rose",
    label: "Rose",
    pageBg: "bg-gradient-to-b from-rose-50/80 via-stone-50 to-stone-50",
    accentBg: "bg-rose-600",
    accentBgHover: "hover:bg-rose-700",
    accentText: "text-white",
    accentSoft: "bg-rose-50",
    accentBorder: "border-rose-200",
    accentTextColor: "text-rose-600",
    ring: "focus:ring-rose-400",
    swatch: "bg-rose-500",
  },
  violet: {
    key: "violet",
    label: "Violet",
    pageBg: "bg-gradient-to-b from-violet-50/80 via-stone-50 to-stone-50",
    accentBg: "bg-violet-600",
    accentBgHover: "hover:bg-violet-700",
    accentText: "text-white",
    accentSoft: "bg-violet-50",
    accentBorder: "border-violet-200",
    accentTextColor: "text-violet-600",
    ring: "focus:ring-violet-400",
    swatch: "bg-violet-500",
  },
  emerald: {
    key: "emerald",
    label: "Emerald",
    pageBg: "bg-gradient-to-b from-emerald-50/80 via-stone-50 to-stone-50",
    accentBg: "bg-emerald-600",
    accentBgHover: "hover:bg-emerald-700",
    accentText: "text-white",
    accentSoft: "bg-emerald-50",
    accentBorder: "border-emerald-200",
    accentTextColor: "text-emerald-700",
    ring: "focus:ring-emerald-400",
    swatch: "bg-emerald-500",
  },
  sky: {
    key: "sky",
    label: "Sky",
    pageBg: "bg-gradient-to-b from-sky-50/80 via-stone-50 to-stone-50",
    accentBg: "bg-sky-600",
    accentBgHover: "hover:bg-sky-700",
    accentText: "text-white",
    accentSoft: "bg-sky-50",
    accentBorder: "border-sky-200",
    accentTextColor: "text-sky-700",
    ring: "focus:ring-sky-400",
    swatch: "bg-sky-500",
  },
  amber: {
    key: "amber",
    label: "Amber",
    pageBg: "bg-gradient-to-b from-amber-50/80 via-stone-50 to-stone-50",
    accentBg: "bg-amber-600",
    accentBgHover: "hover:bg-amber-700",
    accentText: "text-white",
    accentSoft: "bg-amber-50",
    accentBorder: "border-amber-200",
    accentTextColor: "text-amber-700",
    ring: "focus:ring-amber-400",
    swatch: "bg-amber-500",
  },
};

export function getTheme(key: string): Theme {
  // Legacy keys from the earlier palette map onto the new set.
  const legacy: Record<string, string> = { lavender: "violet", mint: "emerald", sunshine: "amber" };
  return THEMES[legacy[key] ?? key] ?? THEMES.rose;
}

export const EVENT_COLORS: Record<string, { chip: string; dot: string }> = {
  rose: { chip: "bg-rose-50 text-rose-600", dot: "bg-rose-500" },
  violet: { chip: "bg-violet-50 text-violet-600", dot: "bg-violet-500" },
  emerald: { chip: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  sky: { chip: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  amber: { chip: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  // legacy event-type colors
  lavender: { chip: "bg-violet-50 text-violet-600", dot: "bg-violet-500" },
  mint: { chip: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  sunshine: { chip: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
};
