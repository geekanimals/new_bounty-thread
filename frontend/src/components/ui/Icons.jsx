// Chhote inline SVG icons — poori site mein reuse hote hain.
// Har icon `size` aur `stroke` prop leta hai, colour `currentColor` se aata hai.

const base = (size, stroke) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: stroke,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
});

export const ArrowRight = ({ size = 16, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ChevronDown = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const Check = ({ size = 14, stroke = 2.4 }) => (
  <svg {...base(size, stroke)}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const Search = ({ size = 16, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const Globe = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
  </svg>
);

export const PlaySquare = ({ size = 16, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M10 8.5v7l5.5-3.5z" />
  </svg>
);

export const Star = ({ size = 18, stroke = 1.8 }) => (
  <svg {...base(size, stroke)}>
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
  </svg>
);

export const Building = ({ size = 18, stroke = 1.8 }) => (
  <svg {...base(size, stroke)}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" />
  </svg>
);

export const Users = ({ size = 18, stroke = 1.8 }) => (
  <svg {...base(size, stroke)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6" />
  </svg>
);

export const Heart = ({ size = 18, stroke = 1.8 }) => (
  <svg {...base(size, stroke)}>
    <path d="M12 20s-7.5-4.5-7.5-10.2A4.3 4.3 0 0112 7.3a4.3 4.3 0 017.5 2.5C19.5 15.5 12 20 12 20z" />
  </svg>
);

export const Instagram = ({ size = 16, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
  </svg>
);

export const Chat = ({ size = 16, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M4 19.5l1.4-4A8 8 0 1112 20a8 8 0 01-3.6-.9z" />
  </svg>
);

export const Send = ({ size = 16, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />
  </svg>
);

export const Plus = ({ size = 14, stroke = 2.2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Menu = ({ size = 22, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const Close = ({ size = 22, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const Sparkle = ({ size = 14, stroke = 1.8 }) => (
  <svg {...base(size, stroke)}>
    <path d="M10 3l1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z" />
  </svg>
);

export const Eye = ({ size = 18, stroke = 1.8 }) => (
  <svg {...base(size, stroke)}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const ShieldCheck = ({ size = 18, stroke = 1.8 }) => (
  <svg {...base(size, stroke)}>
    <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
    <path d="M8.5 12l2.5 2.5 4.5-4.5" />
  </svg>
);

export const Wallet = ({ size = 18, stroke = 1.8 }) => (
  <svg {...base(size, stroke)}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M16 12h2M3 9h18" />
  </svg>
);

export const Pin = ({ size = 18, stroke = 1.8 }) => (
  <svg {...base(size, stroke)}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export const Info = ({ size = 16, stroke = 1.8 }) => (
  <svg {...base(size, stroke)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.5v.5" />
  </svg>
);

export const Bell = ({ size = 18, stroke = 1.8 }) => (
  <svg {...base(size, stroke)}>
    <path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15zM10 20.5a2 2 0 004 0" />
  </svg>
);

export const Refresh = ({ size = 15, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M20 11a8 8 0 00-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0014.3 4.9L20 16M20 20v-4h-4" />
  </svg>
);

export const User = ({ size = 28, stroke = 1.5 }) => (
  <svg {...base(size, stroke)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0116 0" />
  </svg>
);

export const WhatsApp = ({ size = 15, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <path d="M4 20l1.3-3.9A8 8 0 1112 20a8 8 0 01-4.2-1.2z" />
    <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 01-2-2l.8-1-1-2z" />
  </svg>
);

export const Megaphone = ({ size = 15, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <path d="M3 10v4h4l6 4V6L7 10zM16.5 9a4 4 0 010 6M19 6.5a7.5 7.5 0 010 11" />
  </svg>
);

export const Home = ({ size = 15, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />
  </svg>
);

/* ---------- Creator app icons ---------- */

export const Grid = ({ size = 16, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </svg>
);

export const IdCard = ({ size = 16, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <circle cx="9" cy="11" r="2" />
    <path d="M6 16a3 3 0 016 0M14.5 10h3.5M14.5 13.5h3.5" />
  </svg>
);

export const Moon = ({ size = 15, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />
  </svg>
);

export const LogOut = ({ size = 15, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <path d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4M10 16l-4-4 4-4M6 12h10" />
  </svg>
);

export const Share = ({ size = 15, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <circle cx="18" cy="5.5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4" />
  </svg>
);

export const ArrowLeft = ({ size = 15, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const Calendar = ({ size = 14, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);

export const Gift = ({ size = 14, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <rect x="3.5" y="8" width="17" height="5" rx="1" />
    <path d="M5 13v7h14v-7M12 8v12M12 8S10.5 3.5 8 4.5 9 8 12 8zM12 8s1.5-4.5 4-3.5S15 8 12 8z" />
  </svg>
);

export const Clock = ({ size = 14, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const ImageIcon = ({ size = 16, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M20.5 16l-5-5-8.5 8.5" />
  </svg>
);

export const Upload = ({ size = 16, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
  </svg>
);

export const Download = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M12 4v12M7 11l5 5 5-5M4 20h16" />
  </svg>
);

export const LinkIcon = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M10 14a4 4 0 005.6 0l3-3a4 4 0 00-5.6-5.6l-1 1M14 10a4 4 0 00-5.6 0l-3 3a4 4 0 005.6 5.6l1-1" />
  </svg>
);

export const Ticket = ({ size = 14, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <path d="M4 7h16v3a2 2 0 000 4v3H4v-3a2 2 0 000-4z" />
    <path d="M10 7v10" strokeDasharray="2 2" />
  </svg>
);

export const Truck = ({ size = 15, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <path d="M3 6h11v10H3zM14 9h4l3 3.5V16h-7" />
    <circle cx="7" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </svg>
);

export const Lock = ({ size = 15, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 018 0v2.5" />
  </svg>
);

export const Edit = ({ size = 14, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
  </svg>
);

export const Target = ({ size = 16, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);

export const BarChart = ({ size = 16, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <path d="M4 20V4M4 20h16M9 16v-5M13.5 16V8M18 16v-3" />
  </svg>
);

export const TrendUp = ({ size = 11, stroke = 2.2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M4 17l6-6 4 4 6-7M14 8h6v6" />
  </svg>
);

export const Film = ({ size = 15, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <path d="M10 9.5v5l4.5-2.5z" />
  </svg>
);

export const Layers = ({ size = 15, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <rect x="7" y="7" width="13" height="13" rx="2.5" />
    <path d="M4 16V6a2 2 0 012-2h10" />
  </svg>
);

export const Smile = ({ size = 15, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 14a4.5 4.5 0 007 0M9 9.5h.01M15 9.5h.01" />
  </svg>
);

export const MoreH = ({ size = 16, stroke = 2.4 }) => (
  <svg {...base(size, stroke)}>
    <path d="M5 12h.01M12 12h.01M19 12h.01" />
  </svg>
);

export const Phone = ({ size = 15, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <rect x="7" y="3" width="10" height="18" rx="2.5" />
    <path d="M11 17.5h2" />
  </svg>
);

export const Filter = ({ size = 13, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M4 5h16l-6 7.5V19l-4-2v-4.5z" />
  </svg>
);

export const Rupee = ({ size = 15, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <path d="M7 5h10M7 9h10M13.5 5c3 0 3 8 0 8H8l7 6" />
  </svg>
);

export const ChevronRight = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const Hash = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16" />
  </svg>
);

export const AtSign = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-4 8" />
  </svg>
);

export const Music = ({ size = 14, stroke = 1.9 }) => (
  <svg {...base(size, stroke)}>
    <path d="M9 18V5l11-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="17" cy="16" r="3" />
  </svg>
);

/* ---------- Brand panel icons ---------- */
export const Bookmark = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M6 4h12v17l-6-4-6 4z" />
  </svg>
);

export const Compass = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2 5-5 2 2-5z" />
  </svg>
);

export const Facebook = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M15 3h-2.5A3.5 3.5 0 009 6.5V10H6.5v3.5H9V21h3.5v-7.5H15l.5-3.5h-3V7a1 1 0 011-1H15z" />
  </svg>
);

export const Receipt = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </svg>
);

export const Settings = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
  </svg>
);

export const CheckSquare = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M8.5 12l2.5 2.5 4.5-5" />
  </svg>
);

export const Zap = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" />
  </svg>
);

export const Copy = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <rect x="8" y="8" width="12" height="12" rx="2.5" />
    <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
  </svg>
);

export const Trash = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);

export const Pause = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M9 5v14M15 5v14" />
  </svg>
);

export const Play = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M7 4.5v15l12-7.5z" />
  </svg>
);

export const Package = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
    <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
  </svg>
);

export const Mail = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M4 7l8 6 8-6" />
  </svg>
);

export const Bank = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />
  </svg>
);

export const QrCode = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" />
  </svg>
);

export const AlertTriangle = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M12 4L2.5 20h19z" />
    <path d="M12 10v4.5M12 17.5v.5" />
  </svg>
);

export const EyeOff = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M3 3l18 18M10.6 6.1A9.7 9.7 0 0112 6c5 0 9 6 9 6a16 16 0 01-2.6 3.2M6.6 6.6C4.3 8.1 3 12 3 12s4 6 9 6a8.6 8.6 0 004.4-1.2" />
    <path d="M9.9 9.9a3 3 0 004.2 4.2" />
  </svg>
);

export const Reply = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M9 7L4 12l5 5" />
    <path d="M4 12h10a6 6 0 016 6v1" />
  </svg>
);

export const FileText = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </svg>
);

export const ArrowUpDown = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4" />
  </svg>
);

export const CreditCard = ({ size = 14, stroke = 2 }) => (
  <svg {...base(size, stroke)}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3 10h18M7 15h4" />
  </svg>
);
