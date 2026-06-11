"use client";

interface PlayerProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

/** SVG progress ring — parity with WP ProgressCircle. */
export function PlayerProgressCircle({
  progress,
  size = 42,
  strokeWidth = 3,
}: PlayerProgressCircleProps) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(progress / 100) * circumference}, ${circumference}`;

  return (
    <div className="relative">
      <svg
        className="-rotate-90 transform"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-700"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-player-success"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
        {Math.round(progress)}%
      </span>
    </div>
  );
}
