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
      aria-label={`Progress ${pct}%`}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#22252a"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#6366f1"
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
        fill="#f3f4f6"
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
        fill="#9ca3af"
        fontSize={size * 0.07}
        fontFamily="'JetBrains Mono', monospace"
        letterSpacing="0.12em"
      >
        PROGRESS
      </text>
    </svg>
  );
}
