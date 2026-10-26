import type { IconName } from "../types";

type IconProps = {
  name: IconName;
  className?: string;
};

const paths: Record<IconName, string> = {
  "overview": `<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>`,
  "patients": `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
  "alerts": `<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>`,
  "questions": `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
  "reports": `<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>`,
  "team": `<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>`,
  "clock": `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  "search": `<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>`,
  "eye": `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`,
  "idea": `<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>`,
  "arrow-left": `<path d="m15 18-6-6 6-6"/>`,
  "filter": `<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>`,
  "microphone": `<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1"/><path d="M12 18v4"/>`,
  "edit": `<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>`,
  "save": `<path d="M20 6 9 17l-5-5"/>`,
  "menu": `<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>`,
  "close": `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
  "plus": `<path d="M12 5v14"/><path d="M5 12h14"/>`,
  "check": `<path d="M20 6 9 17l-5-5"/>`,
  "chevron-right": `<path d="m9 18 6-6-6-6"/>`,
  "chevron-down": `<path d="m6 9 6 6 6-6"/>`,
  "trash": `<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`,
  "send": `<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>`,
  "calendar": `<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>`,
  "phone": `<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>`,
  "user": `<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>`,
  "mail": `<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>`,
  "shield": `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
  "lock": `<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
  "link": `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`,
  "volume": `<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>`,
  "download": `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>`,
  "logout": `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>`,
  "activity": `<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>`,
  "warning": `<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>`,
  "info": `<circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/>`,
  "text": `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h6"/>`,
  "buttons": `<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>`,
  "pause": `<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>`,
  "play": `<path d="m7 4 13 8-13 8V4z"/>`,
  "settings": `<circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="m4.9 4.9 2.1 2.1"/><path d="m17 17 2.1 2.1"/><path d="M2 12h3"/><path d="M19 12h3"/><path d="m4.9 19.1 2.1-2.1"/><path d="m17 7 2.1-2.1"/>`,
  "brand": `<path d="M16.00 12.00L22.33 15.77"/><path d="M15.46 14.00L19.06 20.43"/><path d="M14.00 15.46L13.90 22.83"/><path d="M12.00 16.00L8.23 22.33"/><path d="M10.00 15.46L3.57 19.06"/><path d="M8.54 14.00L1.17 13.90"/><path d="M8.00 12.00L1.67 8.23"/><path d="M8.54 10.00L4.94 3.57"/><path d="M10.00 8.54L10.10 1.17"/><path d="M12.00 8.00L15.77 1.67"/><path d="M14.00 8.54L20.43 4.94"/><path d="M15.46 10.00L22.83 10.10"/>`
};

/** Ícones de linha (estilo Lucide), herdam a cor do texto via currentColor. */
export function Icon({ name, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      dangerouslySetInnerHTML={{ __html: paths[name] }}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    />
  );
}
