import { getDefaultConstraints } from '../profiles/constraintCatalog';
import type {
  BrowserName,
  DeviceProfile,
  FormFactor,
  ProfileMeasurement,
} from '../profiles/profile.types';
import type { QueuedMeasurement } from './measurementQueue';

/**
 * Ready-to-paste snippet for an existing profile's `measurements` array
 * in devices.json.
 */
export function createMeasurementEntry(entry: QueuedMeasurement): ProfileMeasurement {
  const { measurement } = entry;

  return {
    effectiveViewport: {
      width: measurement.innerWidth,
      height: measurement.innerHeight,
    },
    smallViewportHeight: measurement.smallViewportHeight ?? undefined,
    largeViewportHeight: measurement.largeViewportHeight ?? undefined,
    measuredAt: measurement.measuredAt,
    osVersion: measurement.osVersion ?? undefined,
    browserVersion: measurement.browserVersion ?? undefined,
    environment: measurement.environment,
    verified: entry.edgeToEdgeConfirmed,
    source: 'field-measurement',
    notes: entry.deviceName || undefined,
  };
}

/**
 * Ready-to-paste profile for devices.json when the measured device
 * is not in the dataset yet. Heuristic fields (formFactor, aspectRatio)
 * are best guesses meant to be reviewed before committing.
 */
export function createDeviceProfileEntry(entry: QueuedMeasurement): DeviceProfile {
  const { measurement } = entry;
  const os = measurement.detectedOS === 'unknown' ? 'windows' : measurement.detectedOS;
  const browser: BrowserName =
    measurement.detectedBrowser === 'unknown' ? 'chrome' : measurement.detectedBrowser;
  const label = entry.deviceName || 'Unnamed measured device';

  return {
    id: slugify(label),
    kind: 'named',
    formFactor: guessFormFactor(measurement.screenWidth, measurement.screenHeight),
    label,
    aspectRatio: formatAspectRatio(measurement.screenWidth, measurement.screenHeight),
    dpr: measurement.devicePixelRatio,
    orientation: measurement.orientation,
    os: { name: os, version: toMajorVersion(measurement.osVersion) },
    browser: { name: browser, version: toMajorVersion(measurement.browserVersion) },
    screen: { width: measurement.screenWidth, height: measurement.screenHeight },
    constraints: getDefaultConstraints(os, browser),
    measurements: [createMeasurementEntry(entry)],
    notes: 'Created from a field measurement; review heuristic fields before merging.',
  };
}

/** Profile-level versions stay coarse (major only); exact versions live on measurements. */
function toMajorVersion(version: string | null): string | undefined {
  return version?.split('.')[0] || undefined;
}

function guessFormFactor(width: number, height: number): FormFactor {
  const smallerSide = Math.min(width, height);

  if (smallerSide < 500) {
    return 'phone';
  }

  if (smallerSide < 900) {
    return 'tablet';
  }

  return 'desktop';
}

function formatAspectRatio(width: number, height: number): string {
  const divisor = greatestCommonDivisor(width, height);
  const ratioWidth = width / divisor;
  const ratioHeight = height / divisor;

  if (ratioWidth <= 64 && ratioHeight <= 64) {
    return `${ratioWidth}:${ratioHeight}`;
  }

  return `${Number((width / height).toFixed(2))}:1`;
}

function greatestCommonDivisor(left: number, right: number): number {
  return right === 0 ? left : greatestCommonDivisor(right, left % right);
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'measured-device';
}
