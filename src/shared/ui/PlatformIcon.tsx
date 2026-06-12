interface PlatformIconEntry {
  src: string;
  label: string;
}

const OS_ICONS: Record<string, PlatformIconEntry> = {
  ios: { src: '/icons/apple.svg', label: 'iOS' },
  macos: { src: '/icons/apple.svg', label: 'macOS' },
  android: { src: '/icons/android.svg', label: 'Android' },
  windows: { src: '/icons/windows.svg', label: 'Windows' },
  linux: { src: '/icons/linux.svg', label: 'Linux' },
  chromeos: { src: '/icons/chromeos.svg', label: 'ChromeOS' },
};

const BROWSER_ICONS: Record<string, PlatformIconEntry> = {
  chrome: { src: '/icons/chrome.svg', label: 'Chrome' },
  safari: { src: '/icons/safari.svg', label: 'Safari' },
  edge: { src: '/icons/edge.svg', label: 'Edge' },
  firefox: { src: '/icons/firefox.svg', label: 'Firefox' },
  samsungInternet: { src: '/icons/samsung-internet.svg', label: 'Samsung Internet' },
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
