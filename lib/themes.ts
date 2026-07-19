export type Theme = {
  key: string;
  label: string;
  emoji: string;
  pageBg: string; // gradient page background
  accentBg: string; // solid accent (buttons)
  accentBgHover: string;
  accentText: string; // text on accent
  accentSoft: string; // soft tinted background
  accentBorder: string;
  accentTextColor: string; // accent-colored text
  ring: string;
};

export const THEMES: Record<string, Theme> = {
  rose: {
    key: "rose",
    label: "Strawberry Milk",
    emoji: "🍓",
    pageBg: "bg-gradient-to-br from-rose-100 via-pink-50 to-orange-50",
    accentBg: "bg-rose-400",
    accentBgHover: "hover:bg-rose-500",
    accentText: "text-white",
    accentSoft: "bg-rose-100",
    accentBorder: "border-rose-200",
    accentTextColor: "text-rose-500",
    ring: "focus:ring-rose-300",
  },
  lavender: {
    key: "lavender",
    label: "Lavender Haze",
    emoji: "💜",
    pageBg: "bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-50",
    accentBg: "bg-violet-400",
    accentBgHover: "hover:bg-violet-500",
    accentText: "text-white",
    accentSoft: "bg-violet-100",
    accentBorder: "border-violet-200",
    accentTextColor: "text-violet-500",
    ring: "focus:ring-violet-300",
  },
  mint: {
    key: "mint",
    label: "Matcha Latte",
    emoji: "🍵",
    pageBg: "bg-gradient-to-br from-emerald-100 via-teal-50 to-lime-50",
    accentBg: "bg-emerald-400",
    accentBgHover: "hover:bg-emerald-500",
    accentText: "text-white",
    accentSoft: "bg-emerald-100",
    accentBorder: "border-emerald-200",
    accentTextColor: "text-emerald-600",
    ring: "focus:ring-emerald-300",
  },
  sky: {
    key: "sky",
    label: "Blueberry Sky",
    emoji: "🫐",
    pageBg: "bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-50",
    accentBg: "bg-sky-400",
    accentBgHover: "hover:bg-sky-500",
    accentText: "text-white",
    accentSoft: "bg-sky-100",
    accentBorder: "border-sky-200",
    accentTextColor: "text-sky-600",
    ring: "focus:ring-sky-300",
  },
  sunshine: {
    key: "sunshine",
    label: "Golden Hour",
    emoji: "🌞",
    pageBg: "bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50",
    accentBg: "bg-amber-400",
    accentBgHover: "hover:bg-amber-500",
    accentText: "text-white",
    accentSoft: "bg-amber-100",
    accentBorder: "border-amber-200",
    accentTextColor: "text-amber-600",
    ring: "focus:ring-amber-300",
  },
};

export function getTheme(key: string): Theme {
  return THEMES[key] ?? THEMES.rose;
}

export const EVENT_COLORS: Record<string, { chip: string; dot: string }> = {
  rose: { chip: "bg-rose-100 text-rose-600", dot: "bg-rose-400" },
  lavender: { chip: "bg-violet-100 text-violet-600", dot: "bg-violet-400" },
  mint: { chip: "bg-emerald-100 text-emerald-600", dot: "bg-emerald-400" },
  sky: { chip: "bg-sky-100 text-sky-600", dot: "bg-sky-400" },
  sunshine: { chip: "bg-amber-100 text-amber-600", dot: "bg-amber-400" },
};
