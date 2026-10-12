// Íconos line-art (trazo fino) para toda la app. Todos heredan currentColor.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

const make = (paths) =>
  function Icon(props) {
    return (
      <svg {...base} {...props}>
        {paths}
      </svg>
    )
  }

export const IconHome = make(
  <>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-6h4v6" />
  </>,
)

export const IconTag = make(
  <>
    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
    <circle cx="7.5" cy="7.5" r="1.3" />
  </>,
)

export const IconReceipt = make(
  <>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </>,
)

export const IconBox = make(
  <>
    <path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16V8Z" />
    <path d="M3.5 8 12 12.5 20.5 8M12 12.5v8" />
  </>,
)

export const IconChart = make(
  <>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <path d="M8 15v-4M12 15V7M16 15v-2" />
  </>,
)

export const IconShip = make(
  <>
    <path d="M3 17c1.5 1 3 1.5 4.5 0 1.5 1.5 3 1.5 4.5 0 1.5 1.5 3 1.5 4.5 0 1.5 1.5 3 1 4.5 0" />
    <path d="M4 14l1-4h14l1 4" />
    <path d="M7 10V6h10v4M10 6V4h4v2" />
  </>,
)

export const IconTarget = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.2" />
  </>,
)

export const IconUsers = make(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />
    <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
    <path d="M17.5 14.5c2.2.6 3.5 2.6 3.5 5.5" />
  </>,
)

export const IconPlus = make(<path d="M12 5v14M5 12h14" />)
export const IconMinus = make(<path d="M5 12h14" />)
export const IconX = make(<path d="M6 6l12 12M18 6 6 18" />)
export const IconCheck = make(<path d="m5 12.5 4.5 4.5L19 7.5" />)
export const IconChevronDown = make(<path d="m6 9 6 6 6-6" />)
export const IconChevronRight = make(<path d="m9 6 6 6-6 6" />)
export const IconChevronLeft = make(<path d="m15 6-6 6 6 6" />)
export const IconSearch = make(
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </>,
)
export const IconEdit = make(
  <>
    <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    <path d="m13.5 6.5 3 3" />
  </>,
)
export const IconTrash = make(
  <>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
  </>,
)
export const IconDownload = make(
  <>
    <path d="M12 4v11M7 10l5 5 5-5" />
    <path d="M4 19h16" />
  </>,
)
export const IconUpload = make(
  <>
    <path d="M12 15V4M7 9l5-5 5 5" />
    <path d="M4 19h16" />
  </>,
)
export const IconCamera = make(
  <>
    <path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" />
    <circle cx="12" cy="13" r="3.2" />
  </>,
)
export const IconAlert = make(
  <>
    <path d="M12 4 2.8 20h18.4L12 4Z" />
    <path d="M12 10v4M12 17.2v.2" />
  </>,
)
export const IconInfo = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8v.2" />
  </>,
)
export const IconTrendUp = make(
  <>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </>,
)
export const IconTrendDown = make(
  <>
    <path d="m3 7 6 6 4-4 8 8" />
    <path d="M15 17h6v-6" />
  </>,
)
export const IconWallet = make(
  <>
    <path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    <path d="M3 7V6a2 2 0 0 1 2-2h11v3" />
    <circle cx="16.5" cy="14" r="1.2" />
  </>,
)
export const IconCoins = make(
  <>
    <ellipse cx="9" cy="7" rx="6" ry="2.5" />
    <path d="M3 7v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V7" />
    <path d="M3 12v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5" />
    <path d="M15 10.2c3.4.2 6 1.3 6 2.8v4.5c0 1.4-2.7 2.5-6 2.5" />
  </>,
)
export const IconRefresh = make(
  <>
    <path d="M20 12a8 8 0 1 1-2.3-5.7" />
    <path d="M20 4v5h-5" />
  </>,
)
export const IconCalendar = make(
  <>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </>,
)
export const IconMore = make(
  <>
    <circle cx="6" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="18" cy="12" r="1.2" fill="currentColor" />
  </>,
)
export const IconGrid = make(
  <>
    <rect x="4" y="4" width="6.5" height="6.5" rx="2" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="2" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="2" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2" />
  </>,
)
export const IconRepeat = make(
  <>
    <path d="M17 3l3 3-3 3" />
    <path d="M20 6H8a4 4 0 0 0-4 4v1" />
    <path d="M7 21l-3-3 3-3" />
    <path d="M4 18h12a4 4 0 0 0 4-4v-1" />
  </>,
)
export const IconSparkle = make(
  <>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="M12 8c.6 2.2 1.8 3.4 4 4-2.2.6-3.4 1.8-4 4-.6-2.2-1.8-3.4-4-4 2.2-.6 3.4-1.8 4-4Z" />
  </>,
)
export const IconLogout = make(
  <>
    <path d="M10 4H5v16h5" />
    <path d="M14 8l4 4-4 4M18 12H9" />
  </>,
)
export const IconPhone = make(
  <path d="M6 3h4l1.5 4.5-2 1.5a10 10 0 0 0 5.5 5.5l1.5-2L21 14v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" />,
)
export const IconHeart = make(
  <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
)
export const IconClipboard = make(
  <>
    <rect x="6" y="4" width="12" height="17" rx="2.5" />
    <path d="M9 4V3.2A1.2 1.2 0 0 1 10.2 2h3.6A1.2 1.2 0 0 1 15 3.2V4" />
    <path d="M9 11h6M9 15h6" />
  </>,
)
export const IconFlame = make(
  <path d="M12 3c1.2 3-3 4.4-3 7.6a3 3 0 0 0 6 0c0-.9-.6-1.6-.6-1.6 1.8.9 2.6 2.8 2.6 4.6a5 5 0 0 1-10 0c0-4.4 3.4-5.6 3.4-9C10.4 3.6 11 3 12 3Z" />,
)
export const IconEye = make(
  <>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
)
export const IconEyeOff = make(
  <>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a15.6 15.6 0 0 1-4.2 4.9M6.5 6.7C3.8 8.5 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.8-.8" />
    <path d="M9.9 10a3 3 0 0 0 4.2 4.2" />
  </>,
)
export const IconSend = make(
  <>
    <path d="M21 3 3 10.5l7 3 3 7L21 3Z" />
    <path d="M10.5 13.5 21 3" />
  </>,
)
export const IconReel = make(
  <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <path d="M10 8.7v6.6l5.5-3.3Z" fill="currentColor" stroke="none" />
  </>,
)
export const IconStory = make(
  <>
    <circle cx="12" cy="12" r="6.5" />
    <circle cx="12" cy="12" r="9.3" strokeDasharray="3 3.4" />
  </>,
)
export const IconCarousel = make(
  <>
    <rect x="2.5" y="7.5" width="13" height="13" rx="3" />
    <path d="M8.7 4.3h9.8a2 2 0 0 1 2 2v9.8" />
  </>,
)
export const IconPin = make(
  <>
    <path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z" />
    <circle cx="12" cy="9" r="2.5" />
  </>,
)
export const IconNote = make(
  <>
    <path d="M6 3h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    <path d="M14 3v5h5" />
    <path d="M8 12h8M8 16h5" />
  </>,
)
export const IconCommentBubble = make(
  <path d="M12 3C6.8 3 2.5 6.6 2.5 11c0 2.5 1.4 4.8 3.7 6.3L5.3 21l4.3-1.7c.8.2 1.6.3 2.4.3 5.2 0 9.5-3.6 9.5-8S17.2 3 12 3Z" />,
)
export const IconBookmarkOutline = make(<path d="M6.5 3.5h11v17l-5.5-4-5.5 4v-17Z" />)
export const IconMusicNote = make(
  <>
    <path d="M9 18V5.5l10-2v12.5" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="15.5" r="2.5" />
  </>,
)
export const IconInstagramGlyph = make(
  <>
    <rect x="3" y="3" width="18" height="18" rx="5.5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
  </>,
)
export const IconSettings = make(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </>,
)

// Huellita (relleno)
export function IconPaw(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <ellipse cx="12" cy="15.6" rx="4.4" ry="3.7" />
      <ellipse cx="6" cy="10.6" rx="1.9" ry="2.4" />
      <ellipse cx="18" cy="10.6" rx="1.9" ry="2.4" />
      <ellipse cx="9" cy="6.4" rx="1.9" ry="2.5" />
      <ellipse cx="15" cy="6.4" rx="1.9" ry="2.5" />
    </svg>
  )
}

// Perrito sentado, line-art. Se usa en estados vacíos y detalles decorativos.
export function DogArt(props) {
  return (
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M43 40c0-9.4 7.6-17 17-17s17 7.6 17 17c0 5-1.6 8.6-4.2 11.6" />
      <path d="M45 33c-5.6-2.6-12 .6-13.4 7-1 5.4 2.4 10 7.4 11" />
      <path d="M75 33c5.6-2.6 12 .6 13.4 7 1 5.4-2.4 10-7.4 11" />
      <circle cx="54" cy="40" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="66" cy="40" r="1.6" fill="currentColor" stroke="none" />
      <path d="M57.5 47h5l-2.5 2.6z" fill="currentColor" stroke="none" />
      <path d="M60 49.6v3.2M55.6 54.6c2.6 2.2 6.2 2.2 8.8 0" />
      <path d="M48.4 55.8c7 4 16.2 4 23.2 0" />
      <path d="M48 52c-9 8-14 20-14 33v12h52V85c0-13-5-25-14-33" />
      <path d="M52 97V74M68 97V74" />
      <path d="M45 97h13M62 97h13" />
      <path d="M86 90c8-2 11-10 6-18" />
      <path d="M35 84c-3 0-6 2-6 5" opacity=".5" />
    </svg>
  )
}

// Perro y gato sentados en un círculo beige (fallback del logo hasta que suban el real).
export function BrandMark({ size = 44, ...props }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" {...props}>
      <circle cx="32" cy="32" r="32" fill="#D5B9A2" />
      <g fill="none" stroke="#1A1A1A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 27c0-4.5 3.5-8 8-8s8 3.5 8 8c0 3-1 5-2.4 6.5" />
        <path d="M20 23c-3-1.5-6 .5-6.6 4-.5 2.6 1.2 5 3.6 5.4" />
        <path d="M32 23c3-1.5 6 .5 6.6 4 .5 2.6-1.2 5-3.6 5.4" />
        <path d="M21 33.5c-4.5 4.5-6.5 10-6.5 15.5v3h22v-3c0-5.5-2-11-6.5-15.5" />
        <path d="M22.5 52V41M30.5 52V41" />
        <path d="M43 28l2-5 3 4h4l3-4 2 5c0 4-3 7-7 7s-7-3-7-7Z" />
        <path d="M45.5 35c-2.5 3.5-3.5 8-3.5 13v4h16v-4c0-5-1-9.5-3.5-13" />
        <path d="M58 46c3-1 4.5-4 3-7" />
        <path d="M47 52v-7M55 52v-7" />
      </g>
      <circle cx="24" cy="27.5" r="1" fill="#1A1A1A" />
      <circle cx="28" cy="27.5" r="1" fill="#1A1A1A" />
      <circle cx="48.5" cy="29" r=".9" fill="#1A1A1A" />
      <circle cx="51.5" cy="29" r=".9" fill="#1A1A1A" />
    </svg>
  )
}
