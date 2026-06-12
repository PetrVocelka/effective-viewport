import type { BrowserName, DeviceProfile } from '../profiles/profile.types';
import type { DeviceViewportRow } from './deviceViewports';

/** Screens at or below this width count as "small desktop" rather than "desktop". */
const SMALL_DESKTOP_MAX_WIDTH = 1440;
/** External monitors start here — where side-docked bars get common and costly. */
const LARGE_DESKTOP_MIN_WIDTH = 1920;
const XL_DESKTOP_MIN_WIDTH = 2560;

/** Device × browser combination that drives a worst case. */
export interface SafeViewportSource {
  deviceLabel: string;
  browser: BrowserName;
}

export interface SafeViewportEntry {
  id: string;
  label: string;
  /** Worst-case (smallest) effective width in the category. */
  width: number;
  /** Worst-case layout width once a classic scrollbar takes its share — equals width without one. */
  contentWidth: number;
  /** Worst-case (smallest) effective height in the category, browser UI expanded (svh). */
  height: number;
  /** Worst-case height with mobile browser UI collapsed while scrolling (lvh). */
  maxHeight: number;
  /** Device that drives the width worst case. */
  widthSource: SafeViewportSource;
  /** Device that drives the height worst case. */
  heightSource: SafeViewportSource;
  deviceCount: number;
}

interface SafeCategory {
  id: string;
  label: string;
  matches: (profile: DeviceProfile) => boolean;
}

const SAFE_CATEGORIES: SafeCategory[] = [
  {
    id: 'mobile-portrait',
    label: 'Mobile · portrait',
    matches: (profile) => profile.formFactor === 'phone' && profile.orientation === 'portrait',
  },
  {
    id: 'mobile-landscape',
    label: 'Mobile · landscape',
    matches: (profile) => profile.formFactor === 'phone' && profile.orientation === 'landscape',
  },
  {
    id: 'tablet-portrait',
    label: 'Tablet · portrait',
    matches: (profile) => profile.formFactor === 'tablet' && profile.orientation === 'portrait',
  },
  {
    id: 'tablet-landscape',
    label: 'Tablet · landscape',
    matches: (profile) => profile.formFactor === 'tablet' && profile.orientation === 'landscape',
  },
  {
    id: 'desktop-small',
    label: 'Desktop · small ≤1440',
    matches: (profile) =>
      profile.formFactor === 'desktop' && profile.screen.width <= SMALL_DESKTOP_MAX_WIDTH,
  },
  {
    id: 'desktop-medium',
    label: 'Desktop · medium <1920',
    matches: (profile) =>
      profile.formFactor === 'desktop' &&
      profile.screen.width > SMALL_DESKTOP_MAX_WIDTH &&
      profile.screen.width < LARGE_DESKTOP_MIN_WIDTH,
  },
  {
    id: 'desktop-large',
    label: 'Desktop · large 1920+',
    matches: (profile) =>
      profile.formFactor === 'desktop' &&
      profile.screen.width >= LARGE_DESKTOP_MIN_WIDTH &&
      profile.screen.width < XL_DESKTOP_MIN_WIDTH,
  },
  {
    id: 'desktop-xl',
    label: 'Desktop · XL 2560+',
    matches: (profile) =>
      profile.formFactor === 'desktop' && profile.screen.width >= XL_DESKTOP_MIN_WIDTH,
  },
];

/**
 * The "design-safe" resolution per category: the smallest effective width and
 * the smallest effective height across the category's rows (svh, browser UI
 * expanded). Rows may span several browsers per device — the result then holds
 * for every device × browser combination. Width and height can come from
 * different devices.
 */
export function createSafeViewportSummary(rows: DeviceViewportRow[]): SafeViewportEntry[] {
  return SAFE_CATEGORIES.flatMap((category) => {
    const categoryRows = rows.filter((row) => category.matches(row.profile));

    if (categoryRows.length === 0) {
      return [];
    }

    const narrowest = minBy(categoryRows, (row) => row.result.viewport.width);
    const narrowestContent = minBy(categoryRows, (row) => row.result.contentWidth);
    const shortest = minBy(categoryRows, (row) => row.result.viewport.height);
    const shortestScrolled = minBy(categoryRows, (row) => row.result.maxViewport.height);

    return [
      {
        id: category.id,
        label: category.label,
        width: narrowest.result.viewport.width,
        contentWidth: narrowestContent.result.contentWidth,
        height: shortest.result.viewport.height,
        maxHeight: shortestScrolled.result.maxViewport.height,
        widthSource: createSource(narrowest),
        heightSource: createSource(shortest),
        deviceCount: new Set(categoryRows.map((row) => row.profile.id)).size,
      },
    ];
  });
}

/** The worst case is browser-specific, so the source carries the browser too. */
function createSource(row: DeviceViewportRow): SafeViewportSource {
  return { deviceLabel: row.profile.label, browser: row.browser };
}

function minBy(rows: DeviceViewportRow[], selector: (row: DeviceViewportRow) => number) {
  return rows.reduce((smallest, row) => (selector(row) < selector(smallest) ? row : smallest));
}
