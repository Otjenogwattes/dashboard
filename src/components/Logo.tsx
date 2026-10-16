/** Radio met een antenne die eindigt in een blaadje, plus woordmerk "balkon". */
export function Logo({ compact = false }: { compact?: boolean }) {
  const size = compact ? 30 : 40;
  return (
    <span className={compact ? 'logo logo--compact' : 'logo'}>
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
        <path d="M78 46 L96 10" stroke="var(--ink)" strokeWidth={compact ? 7 : 6} strokeLinecap="round" />
        <path d="M96 10 Q114 6 116 22 Q100 26 96 10 Z" fill="var(--plant)" />
        <rect x="8" y="44" width="104" height="66" rx="18" fill="var(--music)" />
        <circle cx="42" cy="77" r="18" fill="var(--bg)" />
        {compact ? (
          <>
            <rect x="70" y="64" width="30" height="7" rx="3.5" fill="var(--bg)" />
            <rect x="70" y="80" width="22" height="7" rx="3.5" fill="var(--bg)" />
          </>
        ) : (
          <>
            <circle cx="42" cy="77" r="6" fill="var(--music)" />
            <rect x="70" y="62" width="30" height="5" rx="2.5" fill="var(--bg)" />
            <rect x="70" y="74" width="30" height="5" rx="2.5" fill="var(--bg)" />
            <rect x="70" y="86" width="20" height="5" rx="2.5" fill="var(--bg)" />
          </>
        )}
      </svg>
      <span className="logo__word">balkon</span>
    </span>
  );
}
