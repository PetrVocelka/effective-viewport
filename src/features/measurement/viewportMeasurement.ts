import type {
  BrowserName,
  OperatingSystem,
  Orientation,
  SafeAreaInsets,
} from '../profiles/profile.types';
import type { MeasurementEnvironment } from './measurementContext';
import { UNKNOWN_VERSION_INFO, type VersionInfo, type VersionSource } from './versionDetection';

export interface ViewportMeasurement {
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  screenWidth: number;
  screenHeight: number;
  availableWidth: number;
  availableHeight: number;
  /** 100svh in CSS px — the viewport with all dynamic browser UI expanded. */
  smallViewportHeight: number | null;
  /** 100lvh in CSS px — the viewport once dynamic browser UI collapses. */
  largeViewportHeight: number | null;
  devicePixelRatio: number;
  orientation: Orientation;
  measuredAt: string;
  userAgent: string;
  detectedOS: OperatingSystem | 'unknown';
  detectedBrowser: BrowserName | 'unknown';
  osVersion: string | null;
  browserVersion: string | null;
  versionSource: VersionSource;
  environment: MeasurementEnvironment;
  estimatedOsChromeHeight: number;
  estimatedBrowserChromeHeight: number;
  /** innerWidth − clientWidth: a classic scrollbar's layout cost; 0 with overlay scrollbars. */
  scrollbarWidth: number;
  safeAreaInsets: SafeAreaInsets;
  zoomWarning: string | null;
}

export interface MeasureViewportOptions {
  versionInfo?: VersionInfo;
  environment?: MeasurementEnvironment;
}

export function measureViewport(options: MeasureViewportOptions = {}): ViewportMeasurement {
  const safeAreaInsets = readSafeAreaInsets();
  const devicePixelRatio = window.devicePixelRatio || 1;
  const visualViewportScale = window.visualViewport?.scale ?? 1;
  const versionInfo = options.versionInfo ?? UNKNOWN_VERSION_INFO;

  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    availableWidth: window.screen.availWidth,
    availableHeight: window.screen.availHeight,
    smallViewportHeight: measureViewportUnit('svh'),
    largeViewportHeight: measureViewportUnit('lvh'),
    devicePixelRatio,
    orientation: window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait',
    measuredAt: new Date().toISOString(),
    userAgent: window.navigator.userAgent,
    detectedOS: detectOS(window.navigator.userAgent),
    detectedBrowser: detectBrowser(window.navigator.userAgent),
    osVersion: versionInfo.osVersion,
    browserVersion: versionInfo.browserVersion,
    versionSource: versionInfo.versionSource,
    environment: options.environment ?? 'hardware',
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

/**
 * Both toolbar states of a dynamic mobile browser UI are measurable at once —
 * no scroll gesture needed: svh is the expanded state, lvh the collapsed one.
 */
function measureViewportUnit(unit: 'svh' | 'lvh'): number | null {
  if (typeof CSS === 'undefined' || !CSS.supports('height', `100${unit}`)) {
    return null;
  }

  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.height = `100${unit}`;
  document.body.appendChild(probe);

  const height = probe.getBoundingClientRect().height;
  probe.remove();

  return height;
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
