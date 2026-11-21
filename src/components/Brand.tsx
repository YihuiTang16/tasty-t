export function Brand() {
  return (
    <span className="inline-flex items-center gap-2.5 text-ink" aria-label="SUBwayTREK">
      <svg
        aria-hidden="true"
        viewBox="0 0 40 40"
        className="h-10 w-10 shrink-0"
        role="img"
      >
        <rect width="40" height="40" rx="13" fill="#142B3C" />
        <path d="M8 30.5h24" stroke="#456579" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="11" cy="30.5" r="2" fill="#72DFC7" />
        <circle cx="29" cy="30.5" r="2" fill="#72DFC7" />
        <text
          x="20"
          y="25"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="17"
          fontWeight="800"
          letterSpacing="-1.5"
          fill="#F4BF63"
        >
          S<tspan fill="#72DFC7">T</tspan>
        </text>
      </svg>
      <span className="font-display text-[1.55rem] leading-none tracking-[-0.045em]">
        <span className="text-accent-dark">S</span>UBway<span className="text-harbor">T</span>REK
      </span>
    </span>
  );
}
