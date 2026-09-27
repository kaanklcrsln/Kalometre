// Basit çizgi ikonlar; renk her zaman currentColor.

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const PlusIcon = () => (
  <svg {...base} width={30} height={30} strokeWidth={2.5}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const SettingsIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

export const SendIcon = () => (
  <svg {...base} width={20} height={20}>
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

export const HomeIcon = () => (
  <svg {...base} width={28} height={28} strokeWidth={2.3}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9v11h5v-6h4v6h5V9" />
  </svg>
);

// ---------- Ekleme kategorileri ----------

/** Yiyecek: tabak, çatal, bıçak. */
export const FoodIcon = () => (
  <svg {...base} width={32} height={32} strokeWidth={1.8}>
    <circle cx="12" cy="12" r="5.5" />
    <path d="M3 3v5a2 2 0 0 0 2 2v11M5 3v5M3 3" />
    <path d="M21 21V3c-1.7 1-2.5 3-2.5 6v3H21" />
  </svg>
);

/** İçecek: pipetli bardak. */
export const DrinkIcon = () => (
  <svg {...base} width={32} height={32} strokeWidth={1.8}>
    <path d="M6 8h12l-1.4 12.2a1 1 0 0 1-1 .8H8.4a1 1 0 0 1-1-.8L6 8z" />
    <path d="M13 8l2-5h3" />
    <path d="M6.6 13h10.8" />
  </svg>
);

/** Su: damla. */
export const WaterIcon = () => (
  <svg {...base} width={32} height={32} strokeWidth={1.8}>
    <path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z" />
    <path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5" />
  </svg>
);

/** Abur cubur: ambalajlı şeker. */
export const SnackIcon = () => (
  <svg {...base} width={32} height={32} strokeWidth={1.8}>
    <circle cx="12" cy="12" r="4.5" />
    <path d="M7.5 12 3 8.5v7L7.5 12zM16.5 12 21 8.5v7L16.5 12z" />
    <path d="M10 10.5l4 3" />
  </svg>
);

export const LockIcon = () => (
  <svg {...base} width={56} height={56} strokeWidth={1.8}>
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    <path d="M12 14.5v2.5" />
  </svg>
);

export const CheckIcon = () => (
  <svg {...base} width={20} height={20} strokeWidth={2.4}>
    <path d="M5 12.5 10 17 19 7" />
  </svg>
);
