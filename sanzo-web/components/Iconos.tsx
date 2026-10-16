// Íconos lineales finos (trazo 1.25). Decorativos por defecto: aria-hidden.
type P = React.SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconoBolsa = (p: P) => (
  <svg viewBox="0 0 24 24" width={22} height={22} {...base} {...p}>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </svg>
);

export const IconoMenu = (p: P) => (
  <svg viewBox="0 0 24 24" width={22} height={22} {...base} {...p}>
    <path d="M4 8h16M4 16h16" />
  </svg>
);

export const IconoCerrar = (p: P) => (
  <svg viewBox="0 0 24 24" width={22} height={22} {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconoMas = (p: P) => (
  <svg viewBox="0 0 24 24" width={16} height={16} {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconoMenos = (p: P) => (
  <svg viewBox="0 0 24 24" width={16} height={16} {...base} {...p}>
    <path d="M5 12h14" />
  </svg>
);

export const IconoFlecha = (p: P) => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/** Paseo: huellas. */
export const IconoPaseo = (p: P) => (
  <svg viewBox="0 0 48 48" width={44} height={44} {...base} {...p}>
    <ellipse cx="17" cy="30" rx="5" ry="6" />
    <circle cx="10.5" cy="21" r="2.4" />
    <circle cx="15" cy="16.5" r="2.4" />
    <circle cx="21" cy="16.5" r="2.4" />
    <circle cx="25.2" cy="21" r="2.4" />
    <path d="M30 40c4-3 9-3 13 0M33 34c2.5-1.6 5.5-1.6 8 0" opacity=".7" />
  </svg>
);

/** Todo combina: círculos entrelazados. */
export const IconoCombina = (p: P) => (
  <svg viewBox="0 0 48 48" width={44} height={44} {...base} {...p}>
    <circle cx="18" cy="20" r="9" />
    <circle cx="30" cy="20" r="9" />
    <circle cx="24" cy="30" r="9" />
  </svg>
);

/** Envíos al país: caja. */
export const IconoEnvio = (p: P) => (
  <svg viewBox="0 0 48 48" width={44} height={44} {...base} {...p}>
    <path d="M8 16 24 8l16 8v16l-16 8-16-8V16Z" />
    <path d="M8 16l16 8 16-8M24 24v16M16 12l16 8" />
  </svg>
);

export const IconoInstagram = (p: P) => (
  <svg viewBox="0 0 24 24" width={20} height={20} {...base} {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r=".6" fill="currentColor" />
  </svg>
);

export const IconoFacebook = (p: P) => (
  <svg viewBox="0 0 24 24" width={20} height={20} {...base} {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <path d="M15.5 8h-1.6c-1.2 0-1.9.7-1.9 1.9V20.5M10 12.5h5" />
  </svg>
);

export const IconoWhatsapp = (p: P) => (
  <svg viewBox="0 0 24 24" width={20} height={20} {...base} {...p}>
    <path d="M4.2 19.8 5.3 16A8.2 8.2 0 1 1 8.4 19l-4.2.8Z" />
    <path d="M9.3 8.6c-.3 1.6.9 3.6 2.4 4.9 1.4 1.2 3 1.9 4 1.5l.6-1.2-1.6-.9-.8.7c-1-.4-2-1.3-2.6-2.3l.6-.9-.8-1.7-1.2-.1c-.3 0-.5 0-.6 0Z" />
  </svg>
);

export const IconoTiktok = (p: P) => (
  <svg viewBox="0 0 24 24" width={20} height={20} {...base} {...p}>
    <path d="M14 3.5v11.2a3.8 3.8 0 1 1-3.8-3.8" />
    <path d="M14 3.5c.4 2.6 2.2 4.4 5 4.7" />
  </svg>
);

export const IconoMail = (p: P) => (
  <svg viewBox="0 0 24 24" width={20} height={20} {...base} {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);
