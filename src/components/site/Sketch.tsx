/**
 * Self's hand-drawn marks. Inline SVG with a slight ink wobble (an SVG
 * displacement filter), so they read as drawn by hand, not as icons.
 */

/** A person mid-stride, with a few marks trailing behind: understanding that carries forward. */
export function Walker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="A hand-drawn person walking forward">
      <defs>
        <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="2.4" />
        </filter>
      </defs>
      <g filter="url(#ink)" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* head */}
        <path d="M78 14c5.5-.6 9.8 3.2 9.6 8.2-.2 4.6-4.4 8-9.2 7.6-4.9-.4-8.1-4.3-7.7-8.6.4-4 3.4-6.8 7.3-7.2Z" strokeWidth="4.2" />
        {/* body */}
        <path d="M77 31c-.8 9-2.4 18-3.6 27.5" strokeWidth="4.6" />
        {/* arms */}
        <path d="M76.4 38c-4.6 5-8.4 9.6-11.6 15.2" strokeWidth="3.6" />
        <path d="M77.2 37.5c4.2 4.4 7.6 9.2 10.4 14.6" strokeWidth="3.4" />
        {/* legs */}
        <path d="M73.4 58c-3.4 9.2-7.4 18.6-12.2 27.6" strokeWidth="4.2" />
        <path d="M73.8 58.6c4.8 8.4 8.6 17.4 11.4 26.6l3.6 1.2" strokeWidth="4" />
        {/* the trail behind */}
        <path d="M44 84.6c-2.6.2-5.2.2-7.8.4" strokeWidth="3" />
        <path d="M27.6 85.4c-2 .1-3.8.2-5.6.2" strokeWidth="2.6" />
        <path d="M13.4 85.8c-1.2 0-2.4.1-3.4.1" strokeWidth="2.2" />
      </g>
    </svg>
  );
}

/** A dry-brush underline, painted once under the call to action: a few overlapping strokes with rough edges. */
export function Brush({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 32" preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <filter id="brush" x="-5%" y="-50%" width="110%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.7" numOctaves="4" seed="9" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="9" />
        </filter>
      </defs>
      <g fill="none" stroke="currentColor" strokeLinecap="round" filter="url(#brush)">
        <path d="M10 17c52-4 104-5 160-4.2 72 1 140 .8 220-.6" strokeWidth="17" opacity="0.55" />
        <path d="M14 15.5c60-3 118-3.6 176-3 66 .6 128 .4 196-.8" strokeWidth="11" opacity="0.5" />
        <path d="M24 19.5c70-2.4 140-2.6 210-2 54 .4 104 0 148-.8" strokeWidth="6" opacity="0.45" />
      </g>
    </svg>
  );
}
