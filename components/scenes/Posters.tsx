import type { ReactNode } from "react";

export function NetworkPoster({ id = "network" }: { id?: string }) {
  return (
    <svg className="network-svg" viewBox="0 0 1200 800" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-violet)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-violet)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g fill="none" stroke="var(--color-cyan)" strokeOpacity="0.35">
        <path d="M180 420 C 320 280, 460 520, 620 360" />
        <path d="M620 360 C 760 220, 860 480, 1020 340" />
        <path d="M240 260 C 400 180, 520 300, 620 360" />
        <path d="M180 420 C 260 560, 420 600, 560 520" />
        <path d="M560 520 C 700 470, 860 560, 1020 340" />
      </g>
      {[
        [180, 420],
        [240, 260],
        [620, 360],
        [560, 520],
        [1020, 340],
        [860, 180],
        [400, 600],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="46" fill={`url(#${id}-halo)`} />
          <circle
            className={id === "hero" && x === 620 && y === 360 ? "hero-live-dot" : undefined}
            cx={x}
            cy={y}
            r="8"
            fill="var(--color-violet)"
          />
          <circle cx={x! + 18} cy={y! - 14} r="3" fill="var(--color-cyan)" />
          <circle cx={x! - 16} cy={y! + 12} r="2.5" fill="var(--color-cyan)" />
        </g>
      ))}
    </svg>
  );
}

export function WallsPoster({ after = false }: { after?: boolean }) {
  return (
    <svg className="walls-svg" viewBox="0 0 640 360" aria-hidden="true">
      {after ? (
        <g fill="none" stroke="var(--color-violet)" strokeWidth="3">
          <path d="M40 220 C 160 80, 300 80, 600 200" />
          <path d="M40 250 C 180 140, 320 300, 600 160" />
          <path d="M80 180 C 200 180, 400 40, 580 120" />
        </g>
      ) : (
        <g>
          {[80, 220, 360, 500].map((x) => (
            <rect key={x} x={x} y="40" width="70" height="280" rx="8" fill="var(--color-surface)" stroke="var(--color-line)" />
          ))}
        </g>
      )}
      <circle cx={after ? 80 : 40} cy="200" r="8" fill="var(--color-cyan)" />
      <circle cx={after ? 580 : 600} cy="180" r="8" fill="var(--color-violet)" />
    </svg>
  );
}

export function ShieldPoster() {
  return (
    <svg className="shield-svg" viewBox="0 0 640 480" aria-hidden="true">
      <path
        d="M320 40 L520 110 V250 C520 360 430 430 320 460 C210 430 120 360 120 250 V110 Z"
        fill="none"
        stroke="var(--color-cyan)"
        strokeWidth="2"
      />
      <circle cx="320" cy="240" r="18" fill="var(--color-violet)" />
      <circle cx="260" cy="200" r="4" fill="var(--color-cyan)" />
      <circle cx="380" cy="210" r="4" fill="var(--color-cyan)" />
      <circle cx="340" cy="300" r="4" fill="var(--color-cyan)" />
    </svg>
  );
}

export function ConnectPoster() {
  return (
    <svg className="network-svg" viewBox="0 0 960 420" aria-hidden="true">
      <g fill="none" stroke="var(--color-line-strong)" strokeWidth="2">
        <path d="M180 210 H400" />
        <path d="M560 210 H780" />
      </g>
      <g fill="none" stroke="var(--color-cyan)" strokeWidth="2">
        <path d="M400 150 H560" />
        <path d="M400 210 H560" />
        <path d="M400 270 H560" />
      </g>
      <circle cx="140" cy="210" r="36" fill="var(--color-surface)" stroke="var(--color-violet)" />
      <rect x="400" y="90" width="160" height="240" rx="16" fill="var(--color-surface)" stroke="var(--color-cyan)" />
      <circle cx="820" cy="210" r="48" fill="var(--color-surface)" stroke="var(--color-violet)" />
    </svg>
  );
}

export function ChannelPoster() {
  return (
    <svg className="network-svg" viewBox="0 0 960 360" aria-hidden="true">
      <g fill="var(--color-surface)" stroke="var(--color-line-strong)">
        <rect x="80" y="70" width="220" height="64" rx="16" />
        <rect x="120" y="160" width="180" height="64" rx="16" />
        <rect x="80" y="250" width="220" height="48" rx="16" />
      </g>
      <path d="M320 190 C 420 190, 460 180, 560 180" fill="none" stroke="var(--color-cyan)" strokeWidth="2" />
      <circle cx="680" cy="180" r="42" fill="var(--color-surface)" stroke="var(--color-violet)" />
    </svg>
  );
}

export function PosterFrame({
  label,
  children,
  hero = false,
}: {
  label: string;
  children: ReactNode;
  hero?: boolean;
}) {
  return (
    <div className={hero ? "poster-stack poster-hero" : "poster-stack"} role="img" aria-label={label}>
      <div className="poster-back">
        <div className="aurora" />
        {children}
      </div>
      <div className="poster-mid" aria-hidden="true" />
      <div className="poster-front" aria-hidden="true" />
    </div>
  );
}
