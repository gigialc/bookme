// A little calendar-emoji-style logo in the retro system look.
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="2" y="4" width="28" height="26" rx="5" fill="#fffdf7" stroke="#1a1a1a" strokeWidth="2" />
      <path d="M2 9 a5 5 0 0 1 5-5 h18 a5 5 0 0 1 5 5 v4 H2 Z" fill="#e03a3e" stroke="#1a1a1a" strokeWidth="2" />
      <rect x="8.5" y="1" width="3" height="6" rx="1.5" fill="#fffdf7" stroke="#1a1a1a" strokeWidth="1.5" />
      <rect x="20.5" y="1" width="3" height="6" rx="1.5" fill="#fffdf7" stroke="#1a1a1a" strokeWidth="1.5" />
      <text
        x="16"
        y="26"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontWeight="bold"
        fontSize="11"
        fill="#1a1a1a"
      >
        17
      </text>
    </svg>
  );
}
