export function Brand() {
  return (
    <span className="inline-flex items-center gap-2.5 text-ink" aria-label="SUBwayTREK">
      <svg aria-hidden="true" viewBox="0 0 40 40" className="h-10 w-10 shrink-0" role="img">
        <rect width="40" height="40" rx="13" fill="#142B3C" />
        <path d="M12 13c0-3 2-5 5-5h6c3 0 5 2 5 5v17c0 3-2 5-5 5h-6c-3 0-5-2-5-5V13Z" fill="#F4EEE2" />
        <path d="M15 13c0-1.3 1-2.3 2.3-2.3h5.4c1.3 0 2.3 1 2.3 2.3v6H15v-6Z" fill="#294B60" />
        <circle cx="14.8" cy="25" r="1.5" fill="#F4BF63" />
        <circle cx="25.2" cy="25" r="1.5" fill="#F4BF63" />
        <path d="M14.5 30h11" stroke="#294B60" strokeWidth="1.5" strokeLinecap="round" />
        <text x="20" y="29" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="8.5" fontWeight="800" letterSpacing="-.7" fill="#F4BF63">S<tspan fill="#0876C9">T</tspan></text>
        <path d="M8 35h24" stroke="#72DFC7" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="11" cy="35" r="1.5" fill="#72DFC7" />
        <circle cx="29" cy="35" r="1.5" fill="#72DFC7" />
      </svg>
      <span className="font-display text-[1.55rem] leading-none tracking-[-0.045em]">
        <span className="text-accent-dark">S</span>UBway<span className="text-[#0876C9]">T</span>REK
      </span>
    </span>
  );
}
