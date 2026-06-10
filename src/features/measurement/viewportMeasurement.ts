import type {
  BrowserName,
  OperatingSystem,
  Orientation,
  SafeAreaInsets,
} from '../profiles/profile.types';

export interface ViewportMeasurement {
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  screenWidth: number;
  screenHeight: number;
  availableWidth: number;
  availableHeight: number;
  devicePixelRatio: number;
  orientation: Orientation;
  measuredAt: string;
  userAgent: string;
  detectedOS: OperatingSystem | 'unknown';
  detectedBrowser: BrowserName | 'unknown';
  estimatedOsChromeHeight: number;
  estimatedBrowserChromeHeight: number;
  /** innerWidth − clientWidth: a classic scrollbar's layout cost; 0 with overlay scrollbars. */
  scrollbarWidth: number;
  safeAreaInsets: SafeAreaInsets;
  zoomWarning: string | null;
}

export function measureViewport(): ViewportMeasurement {
  const safeAreaInsets = readSafeAreaInsets();
  const devicePixelRatio = window.devicePixelRatio || 1;
  const visualViewportScale = window.visualViewport?.scale ?? 1;

  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    availableWidth: window.screen.availWidth,
    availableHeight: window.screen.availHeight,
    devicePixelRatio,
    orientation: window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait',
    measuredAt: new Date().toISOString(),
    userAgent: window.navigator.userAgent,
    detectedOS: detectOS(window.navigator.userAgent),
    detectedBrowser: detectBrowser(window.navigator.userAgent),
    estimatedOsChromeHeight: Math.max(0, window.screen.height - window.screen.availHeight),
    estimatedBrowserChromeHeight: Math.max(0, window.outerHeight - window.innerHeight),
    scrollbarWidth: Math.max(0, window.innerWidth - document.documentElement.clientWidth),
    safeAreaInsets,
    zoomWarning:
      visualViewportScale !== 1
        ? 'Browser zoom or pinch zoom may affect the measured viewport. Measure at 100% zoom when possible.'
        : null,
  };
}

export function detectOS(userAgent: string): OperatingSystem | 'unknown' {
  const normalizedUserAgent = userAgent.toLowerCase();

  if (normalizedUserAgent.includes('windows')) {
    return 'windows';
  }

  if (normalizedUserAgent.includes('iphone') || normalizedUserAgent.includes('ipad')) {
    return 'ios';
  }

  if (normalizedUserAgent.includes('android')) {
    return 'android';
  }

  if (normalizedUserAgent.includes('mac os x') || normalizedUserAgent.includes('macintosh')) {
    return 'macos';
  }

  if (normalizedUserAgent.includes('cros')) {
    return 'chromeos';
  }

  if (normalizedUserAgent.includes('linux')) {
    return 'linux';
  }

  return 'unknown';
}

export function detectBrowser(userAgent: string): BrowserName | 'unknown' {
  if (userAgent.includes('Edg/')) {
    return 'edge';
  }

  if (userAgent.includes('Firefox/')) {
    return 'firefox';
  }

  if (userAgent.includes('SamsungBrowser/')) {
    return 'samsungInternet';
  }

  if (userAgent.includes('Chrome/') || userAgent.includes('CriOS/')) {
    return 'chrome';
  }

  if (userAgent.includes('Safari/')) {
    return 'safari';
  }

  return 'unknown';
}

function readSafeAreaInsets(): SafeAreaInsets {
  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.paddingTop = 'env(safe-area-inset-top)';
  probe.style.paddingRight = 'env(safe-area-inset-right)';
  probe.style.paddingBottom = 'env(safe-area-inset-bottom)';
  probe.style.paddingLeft = 'env(safe-area-inset-left)';
  document.body.appendChild(probe);

  const styles = window.getComputedStyle(probe);
  const safeAreaInsets = {
    top: toPixels(styles.paddingTop),
    right: toPixels(styles.paddingRight),
    bottom: toPixels(styles.paddingBottom),
    left: toPixels(styles.paddingLeft),
  };

  probe.remove();

  return safeAreaInsets;
}

function toPixels(value: string): number {
  return Number.parseFloat(value) || 0;
}
