import { useId } from 'react';

export default function BrandLogo({
  size = 38,
  showText = true,
  compact = false,
  theme = 'dark',
}) {
  const rawId = useId();
  const safeId = rawId.replace(/:/g, '');
  const bgGradientId = `brand-bg-${safeId}`;
  const accentGradientId = `brand-accent-${safeId}`;
  const borderGradientId = `brand-border-${safeId}`;

  const shouldRenderText = showText && !compact;
  const variantClass = theme === 'light' ? 'brand-logo--light' : 'brand-logo--dark';

  return (
    <div className={`brand-logo ${variantClass} ${compact ? 'brand-logo--compact' : ''}`}>
      <svg
        className="brand-logo-mark"
        viewBox="0 0 48 48"
        width={size}
        height={size}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={bgGradientId} x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#16263F" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id={accentGradientId} x1="4" y1="3" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--accent, var(--coral, #ee6c4d))" stopOpacity="0.96" />
            <stop offset="68%" stopColor="var(--accent, var(--coral, #ee6c4d))" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id={borderGradientId} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="13" fill={`url(#${bgGradientId})`} />
        <rect x="2" y="2" width="44" height="44" rx="13" fill={`url(#${accentGradientId})`} />
        <rect
          x="3.4"
          y="3.4"
          width="41.2"
          height="41.2"
          rx="11.6"
          fill="none"
          stroke={`url(#${borderGradientId})`}
          strokeWidth="1.2"
        />
        <circle cx="24" cy="11.8" r="3" fill="#FFFFFF" />
        <circle cx="35.6" cy="12.3" r="1.8" fill="#FFFFFF" fillOpacity="0.82" />
        <path
          d="M12.5 18.8C18.8 15.8 29.2 15.8 35.5 18.8"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <path
          d="M24 19.6V35.4"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4.4"
          strokeLinecap="round"
        />
        <path
          d="M19.8 35.4H28.2"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.55"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>

      {shouldRenderText && (
        <span className="brand-logo-copy">
          <strong>TicoSoft S.A.</strong>
          <small>Talento Humano</small>
        </span>
      )}
    </div>
  );
}
