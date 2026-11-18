import type { TopicIcon } from '../content/topics';

/** Iconos vectoriales nítidos de elementos eléctricos reales (sin emojis ni adornos abstractos). */
export function TopicGlyph({ icon, size = 20 }: { icon: TopicIcon; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.85,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (icon) {
    case 'balance':
      return (
        <svg {...common}>
          <path d="M12 3v18M5 21h14M4 7l8-2 8 2" />
          <path d="M4 7l-2 6h5l-3-6ZM20 7l-3 6h5l-2-6Z" />
        </svg>
      );
    case 'wave':
      return (
        <svg {...common}>
          <path d="M2 17h2l3-12 3 9c2 2 5 3 12 3" />
          <path d="M2 20h20" strokeOpacity="0.4" />
        </svg>
      );
    case 'lightning':
      return (
        <svg {...common}>
          <path d="M13 2L4.5 13H11l-1 9 9.5-11.5H13L13 2Z" />
        </svg>
      );
    case 'spark':
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="2.5" />
          <circle cx="19" cy="12" r="2.5" />
          <path d="M7.5 12l2.2-2.5 2.3 5 2.3-4.5 2.2 2" />
        </svg>
      );
    case 'mountain':
      return (
        <svg {...common}>
          <path d="M2 20l6.5-12 4.5 7 3.5-5.5L22 20H2Z" />
          <path d="M6.6 11.5l1.9 1.2 1.8-1.2" />
        </svg>
      );
    case 'insulator':
      return (
        <svg {...common}>
          <path d="M12 2v20" />
          <ellipse cx="12" cy="7" rx="5.5" ry="1.8" />
          <ellipse cx="12" cy="12" rx="5.5" ry="1.8" />
          <ellipse cx="12" cy="17" rx="5.5" ry="1.8" />
        </svg>
      );
    case 'wind':
      return (
        <svg {...common}>
          <path d="M3 8h10a2.5 2.5 0 1 0-2.5-2.5M3 12h14a2.5 2.5 0 1 1-2.5 2.5M3 16h7" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3l8 16H4L12 3Z" strokeDasharray="3 2.5" />
          <circle cx="12" cy="4" r="2" fill="currentColor" />
          <circle cx="16.5" cy="16.5" r="2" />
        </svg>
      );
    case 'ground':
      return (
        <svg {...common}>
          <path d="M12 3v9M4 12h16M7 16h10M10 20h4" />
        </svg>
      );
    case 'bounce':
      return (
        <svg {...common}>
          <path d="M13 4v16" strokeDasharray="2.5 2.5" />
          <path d="M3 9h9M9 6l3 3-3 3M12 16H4M7 13l-3 3 3 3M14 12h7M18 9l3 3-3 3" />
        </svg>
      );
    case 'arrester':
      return (
        <svg {...common}>
          <path d="M12 2v3M12 17v4M8 21h8" />
          <rect x="8" y="5" width="8" height="3.5" rx="1" />
          <rect x="8" y="9.2" width="8" height="3.5" rx="1" />
          <rect x="8" y="13.4" width="8" height="3.5" rx="1" />
        </svg>
      );
    case 'corona':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.5" />
          <circle cx="12" cy="12" r="7.5" strokeDasharray="2 3" />
          <path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M9 12.5l2.2 2.2L15.5 10" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

export function BrandEmblem({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0B63CE" />
      <path d="M16 5L11 26M16 5L21 26M9 12H23M10.5 18H21.5M12.5 22L19.5 18M19.5 22L12.5 18" stroke="#FFFFFF" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="15" r="2" fill="#7BE3C8" />
      <circle cx="23" cy="15" r="2" fill="#FFD166" />
    </svg>
  );
}
