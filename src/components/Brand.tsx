export function Brand() {
  return (
    <span className="inline-flex items-center gap-2.5 text-ink" aria-label="SUBwayTREK">
      <svg aria-hidden="true" viewBox="0 0 48 48" className="h-10 w-10 shrink-0" role="img">
        <path d="M3 6h42M24 3v9M10 6l8 6m20-6-8 6" fill="none" stroke="#263E50" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M17 12h14l4 5 4 22H9l4-22 4-5Z" fill="#168B8D" stroke="#142B3C" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M19 14h10v4H19z" rx="1" fill="#142B3C" />
        <text x="24" y="17" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="3.2" fontWeight="800" fill="#72DFC7">ST</text>
        <path d="M15 21c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v8H15v-8Z" fill="#142B3C" />
        <path d="M17 22h5v5h-5zm9 0h5v5h-5z" fill="#75C8D5" />
        <path d="M24 19v10" stroke="#D1E7E6" strokeWidth="1" />
        <circle cx="13" cy="32" r="2" fill="#F4BF63" />
        <circle cx="35" cy="32" r="2" fill="#F4BF63" />
        <path d="M14 34h20l2 4H12z" fill="#142B3C" />
        <path d="M17 36h14" stroke="#E15A32" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="16" cy="40" r="2" fill="#142B3C" />
        <circle cx="32" cy="40" r="2" fill="#142B3C" />
        <path d="M7 45h34" stroke="#0876C9" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="font-display text-[1.55rem] leading-none tracking-[-0.045em]">
        <span className="text-accent-dark">S</span>UBway<span className="text-[#0876C9]">T</span>REK
      </span>
    </span>
  );
}
