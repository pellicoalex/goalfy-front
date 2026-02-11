export default function GoalfyRadarDefs() {
  return (
    <svg width="0" height="0" className="absolute">
      <defs>
        <linearGradient id="goalfyRadarFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(2,160,221,0.28)" />
          <stop offset="55%" stopColor="rgba(43,84,146,0.18)" />
          <stop offset="100%" stopColor="rgba(43,84,146,0.06)" />
        </linearGradient>

        <linearGradient id="goalfyRadarStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(2,160,221,1)" />
          <stop offset="100%" stopColor="rgba(43,84,146,1)" />
        </linearGradient>

        <filter id="goalfyGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.75 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
