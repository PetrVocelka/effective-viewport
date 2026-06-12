import type { BrowserName, ConstraintId, FormFactor, OperatingSystem } from './profile.types';

export const CONSTRAINT_LABELS: Record<ConstraintId, string> = {
  menuBar: 'macOS menu bar',
  dock: 'macOS Dock',
  taskbar: 'Windows taskbar',
  shelf: 'ChromeOS shelf',
  topChrome: 'Browser UI',
  bookmarksBar: 'Bookmarks bar',
  scrollbar: 'Scrollbar',
  keyboard: 'On-screen keyboard',
};

export const BROWSER_LABELS: Record<BrowserName, string> = {
  chrome: 'Chrome',
  safari: 'Safari',
  edge: 'Edge',
  firefox: 'Firefox',
  samsungInternet: 'Samsung Internet',
};

export const BROWSER_OPTIONS: BrowserName[] = [
  'chrome',
  'safari',
  'edge',
  'firefox',
  'samsungInternet',
];

export type OsBarPosition = 'bottom' | 'side';

/**
 * - on: every desktop device loses scrollbar width — the defensive worst case
 *   (Windows/Linux default, macOS with a mouse or "Always show scroll bars").
 * - off: overlay scrollbars or a page that does not scroll.
 */
export type ScrollbarMode = 'on' | 'off';

/** Mobile browsers always overlay their scrollbars — only desktops lose width. */
export function hasSpaceTakingScrollbar(formFactor: FormFactor, mode: ScrollbarMode): boolean {
  return mode === 'on' && formFactor === 'desktop';
}

/**
 * Opt-in worst case: a focused input with the native on-screen keyboard up.
 * - closed: the default — numbers describe the page at rest.
 * - open: phones and tablets lose the keyboard height while typing.
 */
export type KeyboardMode = 'closed' | 'open';

/** Desktops have hardware keyboards — only touch devices lose the height. */
export function hasOnScreenKeyboard(formFactor: FormFactor, mode: KeyboardMode): boolean {
  return mode === 'open' && formFactor !== 'desktop';
}

/** OS bars users can move to a vertical screen edge (macOS Dock, Windows taskbar, ChromeOS shelf). */
export const SIDE_DOCKABLE_CONSTRAINTS: ConstraintId[] = ['dock', 'taskbar', 'shelf'];

/** Safari only ships on Apple platforms, Samsung Internet only on Android; the rest is cross-platform. */
export function isBrowserAvailable(os: OperatingSystem, browser: BrowserName): boolean {
  if (browser === 'safari') {
    return os === 'macos' || os === 'ios';
  }

  if (browser === 'samsungInternet') {
    return os === 'android';
  }

  return true;
}

export function getAvailableConstraints(
  os: OperatingSystem | 'unknown',
  browser: BrowserName,
): ConstraintId[] {
  if (os === 'ios' || os === 'android') {
    return ['topChrome'];
  }

  const osConstraints: ConstraintId[] = getOsConstraints(os);
  const hasBookmarksBar = browser !== 'safari';

  return hasBookmarksBar
    ? [...osConstraints, 'topChrome', 'bookmarksBar']
    : [...osConstraints, 'topChrome'];
}

function getOsConstraints(os: OperatingSystem | 'unknown'): ConstraintId[] {
  switch (os) {
    case 'macos':
      return ['menuBar', 'dock'];
    case 'windows':
      return ['taskbar'];
    case 'chromeos':
      return ['shelf'];
    default:
      return [];
  }
}

export function getDefaultConstraints(
  os: OperatingSystem | 'unknown',
  browser: BrowserName,
  options: { includeBookmarksBar: boolean } = { includeBookmarksBar: true },
): ConstraintId[] {
  const available = getAvailableConstraints(os, browser);

  return options.includeBookmarksBar
    ? available
    : available.filter((constraint) => constraint !== 'bookmarksBar');
}
