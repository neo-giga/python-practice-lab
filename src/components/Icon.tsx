// One small, consistent icon set: 24-unit grid, 1.75 stroke, round caps.
// Authored here (no icon font, no emoji). Decorative by default (aria-hidden).
const PATHS = {
  today: 'M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z',
  plan: 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16M8.5 3.5v4M15.5 3.5v4M8 14h3M8 17h6',
  problems: 'M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01',
  fluency: 'M4 18 8.5 6l4.5 12M5.7 14h5.6M15 10.5c.6-.9 1.6-1.4 2.7-1.4 1.6 0 2.8 1 2.8 2.7V18M20.5 14.2c-.9-.3-1.8-.4-2.7-.4-1.6 0-2.8.8-2.8 2.2 0 1.3 1 2.1 2.3 2.1 1.4 0 2.6-.9 3.2-2.2',
  reference: 'M5 4.5h9.5a3.5 3.5 0 0 1 3.5 3.5v12H8.5A3.5 3.5 0 0 1 5 16.5zM5 16.5A3.5 3.5 0 0 1 8.5 13H18',
  playground: 'M4.5 5h15a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM7.5 9.5l3 2.5-3 2.5M12.5 15h4',
  about: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.6v.01',
  more: 'M5.5 12h.01M12 12h.01M18.5 12h.01',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
  moon: 'M20 14.2A8 8 0 0 1 9.8 4a8 8 0 1 0 10.2 10.2z',
  system: 'M4 5h16v11H4zM9 20h6M12 16v4',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  chevronDown: 'M6 9.5l6 6 6-6',
  chevronRight: 'M9.5 6l6 6-6 6',
  chevronLeft: 'M14.5 6l-6 6 6 6',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  play: 'M7.5 5.5v13l11-6.5z',
  stop: 'M7 7h10v10H7z',
  hint: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  reset: 'M4.5 10A8 8 0 1 1 5 15M4.5 4.5V10H10',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  external: 'M14 4.5h5.5V10M19.5 4.5 11 13M17 14v4.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1H10',
  edit: 'M4.5 19.5h4l10-10a2.8 2.8 0 0 0-4-4l-10 10zM13.5 6.5l4 4',
  search: 'M10.5 17.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM15.5 15.5 20.5 20.5',
  filter: 'M4 6h16M7 12h10M10 18h4',
  code: 'M8.5 7.5 4 12l4.5 4.5M15.5 7.5 20 12l-4.5 4.5',
  doc: 'M7 3.5h7l4.5 4.5v12.5H7zM14 3.5V8h4.5M9.5 12.5h6M9.5 16h6',
  result: 'M5 19.5V11M10 19.5V5M15 19.5v-6M20 19.5v-10',
  review: 'M20 12a8 8 0 1 1-2.3-5.7M20 4.5V9h-4.5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2',
  download: 'M12 4.5v11M7 11l5 5 5-5M5 19.5h14',
  upload: 'M12 19.5v-11M7 13l5-5 5 5M5 4.5h14',
  trash: 'M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13',
  copy: 'M9 9h10.5v10.5H9zM15 9V5.5a1 1 0 0 0-1-1H5.5a1 1 0 0 0-1 1V14a1 1 0 0 0 1 1H9',
  print: 'M7 8.5V3.5h10v5M7 17H5a1 1 0 0 1-1-1v-6a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 10v6a1 1 0 0 1-1 1h-2M7 14h10v6.5H7z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7 7 0 0 1-1.7 1l-.3 2h-4l-.3-2a7 7 0 0 1-1.7-1l-1.9.7-2-3.4 1.6-1.2a7 7 0 0 1 0-3L3 9.3l2-3.4 1.9.7a7 7 0 0 1 1.7-1l.3-2h4l.3 2a7 7 0 0 1 1.7 1l1.9-.7 2 3.4-1.6 1.2a7 7 0 0 1 0 3z',
  grip: 'M10 6h.01M14 6h.01M10 12h.01M14 12h.01M10 18h.01M14 18h.01',
  circle: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  half: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 4v16',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, className, label }: { name: IconName; size?: number; className?: string; label?: string }) {
  const dotty = name === 'more' || name === 'problems' || name === 'grip';
  return (
    <svg
      className={`icon${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={dotty ? 2.25 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
