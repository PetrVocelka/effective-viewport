import type { MeasurementContext } from './measurementContext';

export type VersionSource = 'provided' | 'clientHints' | 'userAgent' | 'unknown';

export interface VersionInfo {
  osVersion: string | null;
  browserVersion: string | null;
  versionSource: VersionSource;
}

export const UNKNOWN_VERSION_INFO: VersionInfo = {
  osVersion: null,
  browserVersion: null,
  versionSource: 'unknown',
};

/**
 * Resolves OS and browser versions with decreasing trust:
 * URL parameters (automation knows the runtime it booted) → UA Client Hints
 * (Chromium only) → user agent string (frozen/reduced on several platforms,
 * see the per-OS notes below).
 */
export async function resolveVersionInfo(context: MeasurementContext): Promise<VersionInfo> {
  const hintVersions = await readClientHintVersions();
  const userAgentVersions = readUserAgentVersions(window.navigator.userAgent);

  const osVersion =
    context.providedOsVersion ?? hintVersions?.osVersion ?? userAgentVersions.osVersion;
  const browserVersion =
    context.providedBrowserVersion ??
    hintVersions?.browserVersion ??
    userAgentVersions.browserVersion;

  return {
    osVersion,
    browserVersion,
    versionSource: resolveSource(context, hintVersions, osVersion, browserVersion),
  };
}

function resolveSource(
  context: MeasurementContext,
  hintVersions: PartialVersions | null,
  osVersion: string | null,
  browserVersion: string | null,
): VersionSource {
  if (context.providedOsVersion || context.providedBrowserVersion) {
    return 'provided';
  }

  if (hintVersions) {
    return 'clientHints';
  }

  return osVersion || browserVersion ? 'userAgent' : 'unknown';
}

interface PartialVersions {
  osVersion: string | null;
  browserVersion: string | null;
}

interface UserAgentDataBrand {
  brand: string;
  version: string;
}

interface UserAgentData {
  getHighEntropyValues(hints: string[]): Promise<{
    platform?: string;
    platformVersion?: string;
    fullVersionList?: UserAgentDataBrand[];
  }>;
}

async function readClientHintVersions(): Promise<PartialVersions | null> {
  const userAgentData = (window.navigator as Navigator & { userAgentData?: UserAgentData })
    .userAgentData;

  if (!userAgentData) {
    return null;
  }

  try {
    const values = await userAgentData.getHighEntropyValues(['platformVersion', 'fullVersionList']);

    return {
      osVersion: mapPlatformVersion(values.platform, values.platformVersion),
      browserVersion: pickBrandVersion(values.fullVersionList),
    };
  } catch {
    return null;
  }
}

function mapPlatformVersion(platform?: string, platformVersion?: string): string | null {
  if (!platformVersion) {
    return null;
  }

  // Windows reports an internal build line: major >= 13 means Windows 11.
  if (platform === 'Windows') {
    const major = Number.parseInt(platformVersion, 10);

    if (Number.isNaN(major) || major === 0) {
      return null;
    }

    return major >= 13 ? '11' : '10';
  }

  return platformVersion;
}

const GENERIC_BRANDS = ['Chromium', 'Not'];

function pickBrandVersion(brands?: UserAgentDataBrand[]): string | null {
  if (!brands?.length) {
    return null;
  }

  const namedBrand = brands.find(
    (brand) => !GENERIC_BRANDS.some((generic) => brand.brand.includes(generic)),
  );

  return (namedBrand ?? brands.find((brand) => brand.brand === 'Chromium'))?.version ?? null;
}

const BROWSER_VERSION_PATTERNS = [
  /EdgiOS\/([\d.]+)/,
  /Edg\/([\d.]+)/,
  /SamsungBrowser\/([\d.]+)/,
  /FxiOS\/([\d.]+)/,
  /Firefox\/([\d.]+)/,
  /CriOS\/([\d.]+)/,
  /Chrome\/([\d.]+)/,
  /Version\/([\d.]+)/,
];

export function readUserAgentVersions(userAgent: string): PartialVersions {
  return {
    osVersion: readOsVersionFromUserAgent(userAgent),
    browserVersion: matchFirst(userAgent, BROWSER_VERSION_PATTERNS),
  };
}

function readOsVersionFromUserAgent(userAgent: string): string | null {
  const ios = /OS (\d+(?:_\d+)*) like Mac OS/.exec(userAgent);

  if (ios?.[1]) {
    return ios[1].replaceAll('_', '.');
  }

  const android = /Android ([\d.]+)/.exec(userAgent);

  if (android?.[1]) {
    // Chrome's reduced UA freezes this at "10" — Client Hints take precedence.
    return android[1];
  }

  const chromeos = /CrOS \S+ ([\d.]+)/.exec(userAgent);

  if (chromeos?.[1]) {
    return chromeos[1];
  }

  const macos = /Mac OS X (10(?:[_.]\d+)+)/.exec(userAgent);

  if (macos?.[1]) {
    // Frozen at 10_15_7 since Big Sur; only a rough lower bound.
    return macos[1].replaceAll('_', '.');
  }

  // Windows NT 10.0 covers both Windows 10 and 11 — too ambiguous to report.
  return null;
}

function matchFirst(userAgent: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = pattern.exec(userAgent);

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}
