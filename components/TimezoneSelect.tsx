"use client";

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Bogota",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

/** The one timezone picker — Settings and Schedule both edit the same user setting. */
export default function TimezoneSelect({
  value,
  onChange,
  className = "retro-input",
  ariaLabel = "Timezone",
}: {
  value: string;
  onChange: (tz: string) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const list = COMMON_TIMEZONES.includes(value) ? COMMON_TIMEZONES : [value, ...COMMON_TIMEZONES];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      aria-label={ariaLabel}
    >
      {list.map((tz) => (
        <option key={tz} value={tz}>
          {tz.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
