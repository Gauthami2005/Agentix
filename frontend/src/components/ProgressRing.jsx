export function ProgressRing({
  percent,
  size = 128,
  strokeWidth = 7,
}) {
  const pct = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="drop-shadow-[0_0_8px_rgba(6,182,212,0.45)]"
      aria-label={`Progress ${pct}%`}
    >
      <defs>
        <linearGradient id="agentix-ring" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(6,182,212,0.12)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="url(#agentix-ring)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
      <text
        x={center}
        y={center - 4}
        textAnchor="middle"
        fill="#E2E8F0"
        fontSize={size * 0.16}
        fontWeight={700}
        fontFamily="Inter, sans-serif"
      >
        {pct}%
      </text>
      <text
        x={center}
        y={center + 14}
        textAnchor="middle"
        fill="#94A3B8"
        fontSize={size * 0.07}
        fontFamily="'JetBrains Mono', monospace"
        letterSpacing="0.12em"
      >
        PROGRESS
      </text>
    </svg>
  );
}
