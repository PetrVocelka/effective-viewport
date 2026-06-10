import {
  getDefaultConstraints,
  hasSpaceTakingScrollbar,
  type OsBarPosition,
  type ScrollbarMode,
  SIDE_DOCKABLE_CONSTRAINTS,
} from '../profiles/constraintCatalog';
import { calculateEffectiveViewport } from '../profiles/constraintResolver';
import type {
  BrowserName,
  ConstraintDataset,
  ConstraintId,
  DeviceProfile,
  EffectiveViewportResult,
} from '../profiles/profile.types';

/** Overrides describing the native browser's chrome — invalid when simulating another browser. */
const BROWSER_SCOPED_CONSTRAINTS: ConstraintId[] = ['topChrome', 'bookmarksBar'];

export interface DeviceViewportRow {
  profile: DeviceProfile;
  /** Browser the row is simulated with. */
  browser: BrowserName;
  result: EffectiveViewportResult;
  isVerified: boolean;
  hasDynamicChrome: boolean;
}

const DEFAULT_BROWSER_VERSIONS: Record<BrowserName, string> = {
  chrome: '131',
  edge: '131',
  safari: '18',
  firefox: '133',
  samsungInternet: '27',
};

export interface SimulationSettings {
  browser: BrowserName;
  showBookmarksBar: boolean;
  osBarPosition: OsBarPosition;
  scrollbarMode: ScrollbarMode;
}

export function createDeviceViewportRow(
  profile: DeviceProfile,
  constraints: ConstraintDataset,
  settings: SimulationSettings,
): DeviceViewportRow {
  const { browser, showBookmarksBar, osBarPosition, scrollbarMode } = settings;
  const simulationProfile: DeviceProfile =
    browser === profile.browser.name
      ? profile
      : {
          ...profile,
          browser: { name: browser, version: DEFAULT_BROWSER_VERSIONS[browser] },
          constraintOverrides: withoutBrowserScopedOverrides(profile.constraintOverrides),
        };

  const enabledConstraints = getDefaultConstraints(profile.os.name, browser, {
    includeBookmarksBar: showBookmarksBar,
  });
  const horizontalConstraints =
    osBarPosition === 'side'
      ? enabledConstraints.filter((id) => SIDE_DOCKABLE_CONSTRAINTS.includes(id))
      : [];

  const result = calculateEffectiveViewport(
    simulationProfile,
    constraints,
    enabledConstraints,
    {
      osVersion: profile.os.version,
      browserVersion: simulationProfile.browser.version,
    },
    {
      horizontalConstraints,
      includeScrollbar: hasSpaceTakingScrollbar(profile.formFactor, scrollbarMode),
    },
  );

  return {
    profile,
    browser,
    result,
    isVerified: profile.measurements.some((measurement) => measurement.verified),
    hasDynamicChrome: result.maxViewport.height !== result.viewport.height,
  };
}

function withoutBrowserScopedOverrides(
  overrides: DeviceProfile['constraintOverrides'],
): DeviceProfile['constraintOverrides'] {
  if (!overrides) {
    return undefined;
  }

  const entries = Object.entries(overrides).filter(
    ([id]) => !BROWSER_SCOPED_CONSTRAINTS.includes(id as ConstraintId),
  );

  return entries.length ? Object.fromEntries(entries) : undefined;
}

export function sortByEffectiveHeight(rows: DeviceViewportRow[]): DeviceViewportRow[] {
  return [...rows].sort(
    (left, right) => left.result.viewport.height - right.result.viewport.height,
  );
}

export function formatSize(size: { width: number; height: number }): string {
  return `${size.width} × ${size.height}`;
}

export type EffectiveViewport = EffectiveViewportResult;
