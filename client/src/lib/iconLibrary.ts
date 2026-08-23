// Centralised icon catalog used by both the render pipeline (renderSignature)
// and the picker UI. Each entry returns raw SVG markup so we can inject it as
// a data URI in email HTML and as inline SVG in the picker preview.

export type SocialStyle = "filled" | "outlined" | "minimal" | "color";

export interface IconDef {
  id: string;
  label: string;
  /** Return the SVG markup for a given colour (used for stroke or fill). */
  svg: (color: string) => string;
  /** When true, the SVG has its own brand colour and ignores `color`. */
  brand?: boolean;
  /** Optional canonical brand colour (used for the "color" social style). */
  brandColor?: string;
  /**
   * Optional per-style renderer for social icons. If provided, the caller
   * should use this instead of `svg` so "outlined" and "minimal" get their
   * own shape treatment. Falls back to `svg(color)` when omitted.
   */
  svgStyled?: (style: SocialStyle, color: string) => string;
}

const strokeAttrs = (color: string, size = 14) =>
  `xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'`;

const fillAttrs = (color: string, size = 18) =>
  `xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='${color}'`;

// ---- Contact row icons ----------------------------------------------------
export const PHONE_ICONS: IconDef[] = [
  {
    id: "phone",
    label: "Classic phone",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z'/></svg>`,
  },
  {
    id: "phone-alt",
    label: "Phone with waves",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><path d='M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z'/></svg>`,
  },
  {
    id: "handset",
    label: "Retro handset",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><path d='M4 4h4l2 5-2.5 1.5a11 11 0 0 0 6 6l1.5-2.5 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2z'/></svg>`,
  },
  {
    id: "phone-ring",
    label: "Phone ringing",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><path d='M15 2v2m5 3h2M4 4l4 4M20 20l-4-4M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z'/></svg>`,
  },
  {
    id: "phone-in",
    label: "Incoming call",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><polyline points='16 2 16 8 22 8'/><line x1='22' y1='2' x2='16' y2='8'/><path d='M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'/></svg>`,
  },
  {
    id: "phone-office",
    label: "Office phone",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><rect x='4' y='4' width='16' height='16' rx='2'/><path d='M8 4v4h8V4M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01'/></svg>`,
  },
];

export const MOBILE_ICONS: IconDef[] = [
  {
    id: "mobile",
    label: "Mobile",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><rect x='5' y='2' width='14' height='20' rx='2'/><line x1='12' y1='18' x2='12' y2='18'/></svg>`,
  },
  {
    id: "smartphone",
    label: "Rounded phone",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><rect x='5' y='2' width='14' height='20' rx='3'/><line x1='9' y1='18' x2='15' y2='18'/></svg>`,
  },
  {
    id: "cell",
    label: "Cell with screen",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><rect x='6' y='2' width='12' height='20' rx='2'/><rect x='9' y='5' width='6' height='10'/><circle cx='12' cy='18.5' r='0.8' fill='${c}'/></svg>`,
  },
  {
    id: "phone-tablet",
    label: "Tablet",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><rect x='4' y='3' width='16' height='18' rx='2'/><line x1='12' y1='18' x2='12' y2='18'/></svg>`,
  },
  {
    id: "phone-signal",
    label: "Phone signal",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><rect x='5' y='2' width='14' height='20' rx='2'/><path d='M2 8h1M2 12h2M2 16h3'/></svg>`,
  },
  {
    id: "phone-square",
    label: "Square phone",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><rect x='6' y='3' width='12' height='18'/><circle cx='12' cy='18' r='0.5' fill='${c}'/></svg>`,
  },
];

export const EMAIL_ICONS: IconDef[] = [
  {
    id: "mail",
    label: "Mail",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'/><polyline points='22,6 12,13 2,6'/></svg>`,
  },
  {
    id: "envelope",
    label: "Envelope",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><rect x='2' y='5' width='20' height='14' rx='1'/><path d='M2 6l10 7 10-7'/></svg>`,
  },
  {
    id: "at",
    label: "At sign",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><circle cx='12' cy='12' r='4'/><path d='M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8'/></svg>`,
  },
  {
    id: "mail-open",
    label: "Open envelope",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><path d='M21 8v13H3V8l9-6z'/><path d='M3 8l9 7 9-7'/></svg>`,
  },
  {
    id: "inbox",
    label: "Inbox",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><polyline points='22 12 16 12 14 15 10 15 8 12 2 12'/><path d='M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'/></svg>`,
  },
  {
    id: "send",
    label: "Send",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><line x1='22' y1='2' x2='11' y2='13'/><polygon points='22 2 15 22 11 13 2 9 22 2'/></svg>`,
  },
];

export const WEBSITE_ICONS: IconDef[] = [
  {
    id: "globe",
    label: "Globe",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><circle cx='12' cy='12' r='10'/><line x1='2' y1='12' x2='22' y2='12'/><path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/></svg>`,
  },
  {
    id: "link",
    label: "Link",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><path d='M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 1 0-7.07-7.07l-1.5 1.5'/><path d='M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5'/></svg>`,
  },
  {
    id: "browser",
    label: "Browser",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><rect x='2' y='4' width='20' height='16' rx='2'/><line x1='2' y1='9' x2='22' y2='9'/><circle cx='5.5' cy='6.5' r='0.5' fill='${c}'/><circle cx='7.5' cy='6.5' r='0.5' fill='${c}'/></svg>`,
  },
  {
    id: "monitor",
    label: "Monitor",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><rect x='2' y='3' width='20' height='14' rx='2'/><line x1='8' y1='21' x2='16' y2='21'/><line x1='12' y1='17' x2='12' y2='21'/></svg>`,
  },
  {
    id: "compass",
    label: "Compass",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><circle cx='12' cy='12' r='10'/><polygon points='16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76'/></svg>`,
  },
  {
    id: "cursor",
    label: "Cursor",
    svg: (c) =>
      `<svg ${strokeAttrs(c)}><path d='M3 3l7 19 2-8 8-2z'/></svg>`,
  },
];

export const CONTACT_ICONS: Record<string, IconDef[]> = {
  phone: PHONE_ICONS,
  mobile: MOBILE_ICONS,
  email: EMAIL_ICONS,
  website: WEBSITE_ICONS,
};

// Address pin & pronouns — used internally by the renderer only.
export const PIN_SVG = (c: string) =>
  `<svg ${strokeAttrs(c)}><path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'/><circle cx='12' cy='10' r='3'/></svg>`;

// ---- Social icons ---------------------------------------------------------
// SVGs use `currentColor` for stroke/fill in the outlined/minimal styles so the
// same markup can be tinted from the caller. For the "color" style we swap in
// the brand colour directly.
export const SOCIAL_ICONS: IconDef[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    brandColor: "#0A66C2",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 1 1 8.3 6.5a1.78 1.78 0 0 1-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0 0 13 14.19a.66.66 0 0 0 0 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 0 1 2.7-1.4c1.55 0 3.36.86 3.36 3.66z'/></svg>`,
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    brandColor: "#000000",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'/></svg>`,
  },
  {
    id: "instagram",
    label: "Instagram",
    brandColor: "#E4405F",
    svg: (c) =>
      `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='${c}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='2' width='20' height='20' rx='5'/><path d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'/><line x1='17.5' y1='6.5' x2='17.51' y2='6.5'/></svg>`,
  },
  {
    id: "facebook",
    label: "Facebook",
    brandColor: "#1877F2",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z'/></svg>`,
  },
  {
    id: "youtube",
    label: "YouTube",
    brandColor: "#FF0000",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.6 9.4.6 9.4.6s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z'/></svg>`,
  },
  {
    id: "tiktok",
    label: "TikTok",
    brandColor: "#000000",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.44a8.16 8.16 0 0 0 4.77 1.53V6.55a4.85 4.85 0 0 1-1.84-.14z'/></svg>`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    brandColor: "#25D366",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15s-.78.97-.95 1.17c-.18.2-.35.22-.65.08a8.3 8.3 0 0 1-2.44-1.5 9.2 9.2 0 0 1-1.69-2.1c-.18-.3 0-.47.13-.62.13-.14.28-.35.42-.53.14-.17.19-.3.28-.5.09-.2.05-.37-.02-.53-.07-.15-.68-1.65-.93-2.25-.24-.6-.48-.5-.68-.52h-.58a1.1 1.1 0 0 0-.8.38c-.28.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.13 3.25 5.15 4.55.72.3 1.28.5 1.72.63.72.23 1.38.2 1.9.12.58-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.55 15.15L2 22l4.97-1.3A10 10 0 1 0 12 2z'/></svg>`,
  },
  {
    id: "threads",
    label: "Threads",
    brandColor: "#000000",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M17.29 11.14c-.09-.04-.19-.08-.28-.12-.16-3-1.8-4.72-4.55-4.74h-.04c-1.65 0-3.02.7-3.87 1.99l1.52 1.04c.63-.96 1.62-1.16 2.35-1.16h.03c.9.01 1.59.27 2.03.78.32.37.54.88.65 1.53a11.4 11.4 0 0 0-2.6-.13c-2.62.15-4.31 1.68-4.19 3.8.06 1.08.6 2 1.51 2.6a4.6 4.6 0 0 0 2.61.66 4.15 4.15 0 0 0 3.16-1.4c.58-.66.94-1.53 1.11-2.62.68.4 1.19.94 1.47 1.58.48 1.09.5 2.87-.96 4.33-1.28 1.28-2.82 1.83-5.13 1.85-2.57-.02-4.52-.85-5.79-2.46-1.19-1.51-1.81-3.69-1.83-6.48.02-2.79.64-4.97 1.83-6.48C7.48 3.09 9.43 2.26 12 2.24c2.59.02 4.57.85 5.9 2.47.65.8 1.14 1.8 1.47 2.98l1.83-.49c-.39-1.44-1-2.7-1.83-3.72C17.62 1.42 15.16.44 12 .42c-3.14.02-5.57 1-7.24 2.94C3.25 5.19 2.5 7.66 2.48 10.94c.02 3.28.77 5.75 2.28 7.58 1.67 1.94 4.1 2.92 7.24 2.94 2.79-.02 4.76-.75 6.38-2.37 2.12-2.13 2.06-4.8 1.36-6.44a4.68 4.68 0 0 0-2.45-2.51zM12.3 15.6c-.98.06-2.01-.4-2.06-1.36-.04-.7.5-1.5 2.17-1.6.19-.01.38-.02.56-.02.6 0 1.17.06 1.68.17-.19 2.36-1.3 2.75-2.35 2.81z'/></svg>`,
  },
  {
    id: "bluesky",
    label: "Bluesky",
    brandColor: "#0085FF",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M12 10.8c-1.09-2.15-4.05-6.14-6.79-8.08C2.6.87 1.61 1.29.98 1.58.24 1.9 0 3 0 3.68c0 .69.38 5.62.62 6.44.83 2.73 3.65 3.6 6.28 3.32-3.85.57-7.28 1.97-2.78 6.99 4.94 5.07 6.79-1.09 7.87-4.24 1.09 3.15 2.19 9.09 8.24 4.24 4.42-4.98.98-6.42-2.87-6.99 2.63.28 5.45-.59 6.28-3.32.24-.82.62-5.75.62-6.44 0-.68-.24-1.78-.98-2.1-.63-.29-1.62-.71-4.23 1.14C16.05 4.66 13.09 8.65 12 10.8z'/></svg>`,
  },
  {
    id: "mastodon",
    label: "Mastodon",
    brandColor: "#6364FF",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M23.27 5.32c-.3-2.21-2.26-3.96-4.55-4.3-.39-.06-1.85-.27-5.23-.27h-.02c-3.39 0-4.11.21-4.5.27-2.23.33-4.29 1.9-4.79 4.15-.24 1.11-.26 2.34-.22 3.47.06 1.62.07 3.24.23 4.86.11 1.07.28 2.14.53 3.19.46 1.94 2.4 3.55 4.29 4.22 2.03.71 4.21.83 6.3.34a8.6 8.6 0 0 0 .69-.2c.52-.16 1.13-.34 1.58-.66a.05.05 0 0 0 .02-.04v-1.58a.05.05 0 0 0-.06-.05c-1.34.32-2.72.48-4.11.48-2.38 0-3.03-1.13-3.21-1.6a4.97 4.97 0 0 1-.28-1.26.05.05 0 0 1 .06-.05c1.32.32 2.67.48 4.02.48.33 0 .65 0 .97-.01 1.37-.04 2.81-.11 4.15-.37.03-.01.07-.01.1-.02 2.11-.41 4.12-1.68 4.32-4.9.01-.13.03-1.32.03-1.45 0-.44.14-3.13-.02-4.78zM19.53 12.36h-2.29V6.72c0-1.18-.5-1.79-1.5-1.79-1.1 0-1.65.71-1.65 2.13v3.09h-2.28V7.06c0-1.41-.55-2.13-1.65-2.13-1 0-1.5.6-1.5 1.79v5.64H6.37V6.55c0-1.18.3-2.12.91-2.83.63-.7 1.44-1.06 2.44-1.06 1.19 0 2.06.46 2.63 1.37l.55.94.56-.94c.57-.91 1.44-1.37 2.62-1.37 1.01 0 1.83.36 2.46 1.06.6.71.9 1.65.9 2.83v5.81z'/></svg>`,
  },
  {
    id: "github",
    label: "GitHub",
    brandColor: "#181717",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M12 .3a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2c-3.34.73-4.04-1.6-4.04-1.6-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.72.08-.72 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23A11.5 11.5 0 0 1 12 6.8c1.02 0 2.05.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.42.36.81 1.09.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3z'/></svg>`,
  },
  {
    id: "behance",
    label: "Behance",
    brandColor: "#1769FF",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M9.5 15.5H6v-3h3.6c1.05 0 1.9.5 1.9 1.5s-.85 1.5-2 1.5zM6 8.5h3.15c1 0 1.85.35 1.85 1.35s-.7 1.65-1.7 1.65H6zm9.35 8h3.25c.5 0 1.2-.2 1.2-1.4h-5.65c.05.55.4 1.4 1.2 1.4zM9.9 6H2v12h8.05c3 0 4.95-1.35 4.95-3.85 0-1.8-.9-2.65-2.15-3.2 1.05-.5 1.7-1.35 1.7-2.6C14.55 6.85 12.85 6 9.9 6zm12.6 4.5c-1.5-1.75-4.75-1.85-6.55.15-1.75 1.95-1.65 5.5.15 7.15 1.95 1.75 6.05 1.35 6.85-1.65h-2.5c-.4.55-.9.65-1.55.65-1.25 0-1.9-.75-1.95-1.9h6.15c.15-2 .05-3-.6-4.4zM16.4 12c.05-1.2 1-1.75 2.05-1.75 1.15 0 1.9.65 2 1.75zm.6-5.8h4.85V7.5H17z'/></svg>`,
  },
  {
    id: "dribbble",
    label: "Dribbble",
    brandColor: "#EA4C89",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm9.9 11.1c-.13 0-3.4-.1-6.66.32-.36-.87-.78-1.75-1.24-2.6 3.62-1.48 5.28-3.6 5.3-3.63a9.87 9.87 0 0 1 2.6 5.9zM18.03 4.14c-.03.04-1.5 2.06-5 3.4a54.7 54.7 0 0 0-3.75-5.85A9.87 9.87 0 0 1 12 2.1c2.28 0 4.4.83 6.03 2.04zM7.03 2.6a67.3 67.3 0 0 1 3.74 5.83c-4.66 1.24-8.79 1.22-9.06 1.22A9.9 9.9 0 0 1 7.03 2.6zM2.1 12v-.3c.28.01 5.13.07 10.1-1.42.3.55.55 1.12.8 1.7-.13.04-.27.08-.4.13C7.4 13.86 4.54 18.4 4.3 18.8A9.87 9.87 0 0 1 2.1 12zM12 21.9a9.85 9.85 0 0 1-6.06-2.08c.2-.4 2.4-4.65 8.24-6.7l.06-.03A41.85 41.85 0 0 1 16.4 21.3 9.87 9.87 0 0 1 12 21.9zm6.4-1.7a44.24 44.24 0 0 0-1.96-6.63 20 20 0 0 1 5.4-.36 9.86 9.86 0 0 1-3.44 7z'/></svg>`,
  },
  {
    id: "pinterest",
    label: "Pinterest",
    brandColor: "#E60023",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M12 0a12 12 0 0 0-4.37 23.17c-.06-.94-.11-2.39.02-3.42.12-.93 1.28-5.94 1.28-5.94s-.33-.66-.33-1.63c0-1.53.89-2.68 2-2.68.94 0 1.4.7 1.4 1.55 0 .94-.6 2.36-.92 3.67-.26 1.1.55 2 1.63 2 1.96 0 3.46-2.06 3.46-5.04 0-2.63-1.9-4.48-4.6-4.48-3.14 0-4.98 2.35-4.98 4.79 0 .95.36 1.96.82 2.52.09.1.1.2.08.31l-.31 1.26c-.05.2-.16.25-.37.15-1.38-.64-2.24-2.65-2.24-4.27 0-3.48 2.53-6.67 7.28-6.67 3.82 0 6.79 2.72 6.79 6.36 0 3.8-2.4 6.86-5.72 6.86-1.12 0-2.17-.58-2.53-1.27l-.69 2.62c-.25.96-.92 2.17-1.37 2.9A12 12 0 1 0 12 0z'/></svg>`,
  },
  {
    id: "snapchat",
    label: "Snapchat",
    brandColor: "#FFFC00",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M12.2 22.66h-.11c-.05 0-.11.01-.16.01-1.86 0-3.09-.88-4.18-1.65-.77-.55-1.5-1.06-2.36-1.21a5.75 5.75 0 0 0-.83-.06c-.42 0-.75.06-.99.11-.14.03-.27.05-.37.05a.39.39 0 0 1-.42-.34c-.03-.19-.05-.36-.08-.53a4.5 4.5 0 0 1-.75-1.79c0-.16.06-.31.19-.42.06-.05.14-.09.22-.11 2.34-.38 3.4-2.75 3.44-2.86a1.03 1.03 0 0 0 .05-.75c-.13-.31-.55-.5-.83-.63l-.11-.05c-.83-.33-1.28-.72-1.34-1.19-.06-.36.16-.72.53-.88.14-.07.31-.11.47-.11.11 0 .22.02.31.06.31.14.6.22.83.22.28 0 .41-.11.42-.13-.02-.28-.05-.58-.06-.86-.11-1.83-.24-4.13.36-5.47C6.86 1.6 10.1.7 11.98.7l.83-.01h.11c1.88 0 5.13.9 6.79 4.61.6 1.35.47 3.62.36 5.47l-.06 1c-.02.02.09.11.31.11.22 0 .5-.08.8-.19a.85.85 0 0 1 .34-.06c.14 0 .28.03.39.08l.02.01c.36.13.6.42.6.72 0 .38-.28.7-.85 1.02-.06.03-.14.06-.24.09-.28.11-.7.28-.83.6a1 1 0 0 0 .05.75c.05.11 1.09 2.47 3.44 2.86.08.02.16.06.22.11a.55.55 0 0 1 .19.42c0 .17-.05.34-.11.53l-.06.14a4.5 4.5 0 0 1-.61 1.11c-.02.19-.05.36-.08.53a.39.39 0 0 1-.42.34c-.09 0-.22-.02-.37-.05-.24-.05-.55-.11-.99-.11-.27 0-.55.02-.83.06-.86.14-1.59.66-2.36 1.21-1.09.77-2.32 1.65-4.18 1.65z'/></svg>`,
  },
  {
    id: "telegram",
    label: "Telegram",
    brandColor: "#26A5E4",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M11.94.5a11.5 11.5 0 1 0 0 23 11.5 11.5 0 0 0 0-23zm5.34 7.83l-1.78 8.4c-.13.6-.5.74-1 .46l-2.78-2.04-1.34 1.29c-.15.15-.28.28-.55.28l.2-2.8 5.11-4.61c.22-.2-.05-.31-.34-.11l-6.32 3.98-2.73-.85c-.6-.19-.6-.6.13-.89l10.66-4.1c.49-.19.92.11.74.99z'/></svg>`,
  },
  {
    id: "signal",
    label: "Signal",
    brandColor: "#3A76F0",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 12.5l-2.75 2.75a.75.75 0 1 1-1.06-1.06l1.47-1.47H8.34l1.47 1.47a.75.75 0 1 1-1.06 1.06L6 12.5a.75.75 0 0 1 0-1.06l2.75-2.75a.75.75 0 1 1 1.06 1.06L8.34 11.22h6.82L13.69 9.75a.75.75 0 1 1 1.06-1.06L17.5 11.44a.75.75 0 0 1 0 1.06z'/></svg>`,
  },
  {
    id: "discord",
    label: "Discord",
    brandColor: "#5865F2",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M20.32 4.37A19.79 19.79 0 0 0 15.4 2.85a.07.07 0 0 0-.08.03c-.21.38-.44.87-.6 1.26a18.35 18.35 0 0 0-5.44 0c-.16-.4-.4-.88-.61-1.26a.07.07 0 0 0-.08-.03c-1.7.29-3.32.8-4.92 1.52a.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.05a.08.08 0 0 0 .03.06c2.08 1.53 4.1 2.46 6.09 3.07a.07.07 0 0 0 .08-.03c.47-.64.89-1.32 1.24-2.03a.07.07 0 0 0-.04-.1c-.66-.25-1.29-.55-1.9-.9a.07.07 0 0 1-.01-.12c.13-.1.26-.2.38-.3a.07.07 0 0 1 .07-.01c3.98 1.82 8.28 1.82 12.22 0a.07.07 0 0 1 .08.01c.12.1.25.2.38.3a.07.07 0 0 1-.01.12c-.61.36-1.24.65-1.9.9a.07.07 0 0 0-.04.1c.36.7.78 1.38 1.24 2.03a.07.07 0 0 0 .08.03 19.7 19.7 0 0 0 6.1-3.07.07.07 0 0 0 .03-.06c.5-5.18-.84-9.68-3.55-13.65a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.09-2.16-2.42S6.82 10.5 8.02 10.5c1.2 0 2.18 1.1 2.16 2.42 0 1.33-.97 2.4-2.16 2.4zm7.97 0c-1.19 0-2.16-1.09-2.16-2.42s.96-2.42 2.16-2.42c1.2 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.4-2.16 2.4z'/></svg>`,
  },
  {
    id: "twitch",
    label: "Twitch",
    brandColor: "#9146FF",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M11.64 5.93h1.43v4.28h-1.43zm3.93 0h1.43v4.28h-1.43zM7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2zm12.14 9.29l-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h11.43z'/></svg>`,
  },
  {
    id: "vimeo",
    label: "Vimeo",
    brandColor: "#1AB7EA",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M23.98 6.53c-.11 2.35-1.76 5.57-4.94 9.65-3.29 4.26-6.07 6.39-8.34 6.39-1.41 0-2.6-1.3-3.57-3.9-.65-2.38-1.29-4.76-1.94-7.14-.72-2.6-1.49-3.9-2.32-3.9-.18 0-.81.38-1.89 1.13L0 7.31c1.21-1.06 2.4-2.12 3.58-3.19 1.62-1.4 2.83-2.14 3.64-2.21 1.92-.19 3.1 1.12 3.55 3.93.48 3.04.82 4.93 1 5.67.55 2.51 1.15 3.76 1.81 3.76.51 0 1.28-.81 2.31-2.42 1.02-1.62 1.57-2.85 1.65-3.7.15-1.51-.44-2.27-1.76-2.27-.62 0-1.27.14-1.93.42 1.28-4.19 3.72-6.23 7.33-6.11 2.68.07 3.94 1.82 3.79 5.23z'/></svg>`,
  },
  {
    id: "medium",
    label: "Medium",
    brandColor: "#000000",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z'/></svg>`,
  },
  {
    id: "substack",
    label: "Substack",
    brandColor: "#FF6719",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z'/></svg>`,
  },
  {
    id: "reddit",
    label: "Reddit",
    brandColor: "#FF4500",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.646-3.055 4.79-6.83 4.79-3.774 0-6.828-2.144-6.828-4.79 0-.176.016-.35.043-.52-.577-.28-.99-.898-.99-1.614a1.755 1.755 0 0 1 2.96-1.263c1.207-.87 2.878-1.423 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z'/></svg>`,
  },
  {
    id: "spotify",
    label: "Spotify",
    brandColor: "#1ED760",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12A12 12 0 0 0 12 0zm5.5 17.3c-.2.4-.7.5-1.1.3-3-1.8-6.8-2.3-11.2-1.3-.4.1-.9-.2-1-.7-.1-.4.2-.9.7-1 4.9-1.1 9.1-.6 12.5 1.5.4.3.5.8.1 1.2zm1.5-3.3c-.3.4-.8.6-1.3.3-3.5-2.1-8.8-2.8-13-1.5-.5.2-1.1-.1-1.3-.6-.2-.5.1-1.1.6-1.3 4.7-1.4 10.6-.7 14.7 1.8.4.2.6.9.3 1.3zm.1-3.5C15 8 8.4 7.8 4.6 9c-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.4-1.3 11.7-1.1 16.3 1.7.6.4.8 1.1.4 1.7-.2.4-1 .6-1.5.4z'/></svg>`,
  },
  {
    id: "soundcloud",
    label: "SoundCloud",
    brandColor: "#FF5500",
    svg: (c) =>
      `<svg ${fillAttrs(c)}><path d='M23.999 15.4c-.02 2.16-1.77 3.9-3.94 3.9h-9.11c-.36-.02-.65-.31-.65-.68V5.32c0-.31.16-.5.55-.65 1.02-.4 2.11-.6 3.24-.6 4.55 0 8.29 3.4 8.87 7.8 1.24.3 2.05 1.4 2.04 2.53zM8.15 8.87c-.35 0-.63.28-.63.63v9.02c0 .35.28.63.63.63.35 0 .63-.28.63-.63V9.5c0-.35-.28-.63-.63-.63zm-2.53 1.51c-.35 0-.63.28-.63.63v7.5c0 .35.28.63.63.63.35 0 .63-.28.63-.63v-7.5c0-.35-.28-.63-.63-.63zm-2.53.5c-.35 0-.63.28-.63.63v7c0 .35.28.63.63.63.35 0 .63-.28.63-.63v-7c0-.35-.28-.63-.63-.63zm-2.46.5c-.35 0-.63.28-.63.63v6c0 .35.28.63.63.63.35 0 .63-.28.63-.63v-6c0-.35-.28-.63-.63-.63z'/></svg>`,
  },
];

export function socialById(id: string): IconDef | undefined {
  return SOCIAL_ICONS.find((s) => s.id === id);
}

// Style-aware social icon renderer. The four styles are visually distinct:
//   filled     — solid filled glyph in the accent colour.
//   color      — solid filled glyph in the network's brand colour.
//   outlined   — the glyph sits inside a rounded-square outline in the accent
//                colour; the glyph itself is knocked out to white for legibility.
//   minimal    — no badge, just the glyph in a muted tone so it recedes.
//
// This works by delegating to the per-icon `svg` (which paints a solid glyph)
// and layering it inside an SVG badge for the outlined variant. The badge
// approach is email-safe because every mail client already renders our data-URI
// SVGs; we're just producing a slightly different SVG string.
export function renderSocialIconSvg(
  def: IconDef,
  style: SocialStyle,
  accentColor: string,
  mutedColor: string = "#94a3b8",
): string {
  const brand = def.brandColor || accentColor;

  if (style === "filled") return def.svg(accentColor);
  if (style === "color") return def.svg(brand);

  if (style === "outlined") {
    // Rounded-square outline around the glyph, both painted in the accent colour.
    // The glyph is scaled down so it sits inside the border with breathing room.
    const inner = extractSvgInner(def.svg(accentColor));
    return `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'>
      <rect x='2' y='2' width='20' height='20' rx='5' fill='none' stroke='${accentColor}' stroke-width='1.6'/>
      <g transform='translate(4 4) scale(0.667)'>${inner}</g>
    </svg>`;
  }

  // minimal: just the glyph, painted muted at 70% opacity so it recedes
  // relative to the filled/outlined styles.
  const inner = extractSvgInner(def.svg(mutedColor));
  return `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'>
    <g opacity='0.75' transform='translate(2 2) scale(0.833)'>${inner}</g>
  </svg>`;
}

// Pulls the child markup out of an <svg>…</svg> string. Falls back to the
// original string if the regex misses (defensive; every icon in this file uses
// the same wrapper shape).
function extractSvgInner(svg: string): string {
  const m = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  return m ? m[1] : svg;
}

export function contactIconById(row: string, id: string): IconDef | undefined {
  return CONTACT_ICONS[row]?.find((i) => i.id === id) ?? CONTACT_ICONS[row]?.[0];
}
