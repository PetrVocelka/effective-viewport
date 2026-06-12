interface PlatformIconEntry {
  src: string;
  label: string;
}

/* GitHub Pages serves the app from a subpath — public assets must respect
   Vite's base URL (always ends with a slash). */
const iconUrl = (file: string) => `${import.meta.env.BASE_URL}icons/${file}`;

const OS_ICONS: Record<string, PlatformIconEntry> = {
  ios: { src: iconUrl('apple.svg'), label: 'iOS' },
  macos: { src: iconUrl('apple.svg'), label: 'macOS' },
  android: { src: iconUrl('android.svg'), label: 'Android' },
  windows: { src: iconUrl('windows.svg'), label: 'Windows' },
  linux: { src: iconUrl('linux.svg'), label: 'Linux' },
  chromeos: { src: iconUrl('chromeos.svg'), label: 'ChromeOS' },
};

const BROWSER_ICONS: Record<string, PlatformIconEntry> = {
  chrome: { src: iconUrl('chrome.svg'), label: 'Chrome' },
  safari: { src: iconUrl('safari.svg'), label: 'Safari' },
  edge: { src: iconUrl('edge.svg'), label: 'Edge' },
  firefox: { src: iconUrl('firefox.svg'), label: 'Firefox' },
  samsungInternet: { src: iconUrl('samsung-internet.svg'), label: 'Samsung Internet' },
};

export function OsIcon({ os }: { os: string }) {
  return <PlatformIcon entry={OS_ICONS[os]} fallback={os} />;
}

export function BrowserIcon({ browser }: { browser: string }) {
  return <PlatformIcon entry={BROWSER_ICONS[browser]} fallback={browser} />;
}

/** Brand logo as a small inline image; the name stays available to tooltips and screen readers. */
function PlatformIcon({ entry, fallback }: { entry?: PlatformIconEntry; fallback: string }) {
  if (!entry) {
    return <span>{fallback}</span>;
  }

  return (
    <img
      alt={entry.label}
      className="platform-icon"
      height={14}
      loading="lazy"
      src={entry.src}
      title={entry.label}
      width={14}
    />
  );
}
