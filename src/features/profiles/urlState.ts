import type { KeyboardMode, OsBarPosition, ScrollbarMode } from './constraintCatalog';
import type { BrowserName, FormFactor } from './profile.types';

const PAGE_PARAM = 'page';
const DEVICE_PARAM = 'device';
const BROWSER_PARAM = 'browser';
const BOOKMARKS_PARAM = 'bookmarks';
const OS_BAR_PARAM = 'osbar';
const SCROLLBAR_PARAM = 'scrollbar';
const KEYBOARD_PARAM = 'keyboard';
const FORM_FACTOR_PARAM = 'type';
export const TEST_URL_PARAM = 'url';
export const CANVAS_PARAM = 'canvas';
/** `?canvas=all` — the compare-all canvas as a shareable address. */
export const CANVAS_ALL = 'all';

export type AppPage = 'devices' | 'measure';

export type FormFactorFilter = FormFactor | 'all';

export interface UrlState {
  page: AppPage;
  deviceId: string | null;
  browser: BrowserName | null;
  showBookmarksBar: boolean;
  osBarPosition: OsBarPosition;
  scrollbarMode: ScrollbarMode;
  keyboardMode: KeyboardMode;
  formFactorFilter: FormFactorFilter;
  /** The page loaded in every preview — part of the link, so shared canvases
      open with the same site in the frames. Empty = placeholder pages. */
  testUrl: string;
  /** `all` opens the full canvas; a device id opens it with just that device. */
  canvasDeviceId: string | null;
}

export function readUrlState(): UrlState {
  const params = new URLSearchParams(window.location.search);

  return {
    page: parsePage(params.get(PAGE_PARAM)),
    deviceId: params.get(DEVICE_PARAM),
    browser: parseBrowser(params.get(BROWSER_PARAM)),
    showBookmarksBar: params.get(BOOKMARKS_PARAM) !== '0',
    osBarPosition: params.get(OS_BAR_PARAM) === 'side' ? 'side' : 'bottom',
    scrollbarMode: parseScrollbarMode(params.get(SCROLLBAR_PARAM)),
    keyboardMode: params.get(KEYBOARD_PARAM) === 'open' ? 'open' : 'closed',
    formFactorFilter: parseFormFactorFilter(params.get(FORM_FACTOR_PARAM)),
    testUrl: params.get(TEST_URL_PARAM) ?? '',
    canvasDeviceId: params.get(CANVAS_PARAM),
  };
}

export function writeUrlState(state: Partial<UrlState>): void {
  const params = new URLSearchParams(window.location.search);

  if (state.page !== undefined) {
    setOrDelete(params, PAGE_PARAM, state.page === 'devices' ? null : state.page);
  }

  if (state.deviceId !== undefined) {
    setOrDelete(params, DEVICE_PARAM, state.deviceId);
  }

  if (state.browser !== undefined) {
    setOrDelete(params, BROWSER_PARAM, state.browser);
  }

  if (state.showBookmarksBar !== undefined) {
    setOrDelete(params, BOOKMARKS_PARAM, state.showBookmarksBar ? null : '0');
  }

  if (state.osBarPosition !== undefined) {
    setOrDelete(params, OS_BAR_PARAM, state.osBarPosition === 'side' ? 'side' : null);
  }

  if (state.scrollbarMode !== undefined) {
    setOrDelete(params, SCROLLBAR_PARAM, state.scrollbarMode === 'off' ? 'off' : null);
  }

  if (state.keyboardMode !== undefined) {
    setOrDelete(params, KEYBOARD_PARAM, state.keyboardMode === 'open' ? 'open' : null);
  }

  if (state.formFactorFilter !== undefined) {
    setOrDelete(
      params,
      FORM_FACTOR_PARAM,
      state.formFactorFilter === 'all' ? null : state.formFactorFilter,
    );
  }

  if (state.testUrl !== undefined) {
    setOrDelete(params, TEST_URL_PARAM, state.testUrl.trim() ? state.testUrl : null);
  }

  if (state.canvasDeviceId !== undefined) {
    setOrDelete(params, CANVAS_PARAM, state.canvasDeviceId);
  }

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', nextUrl);
}

function setOrDelete(params: URLSearchParams, key: string, value: string | null): void {
  if (value === null) {
    params.delete(key);
  } else {
    params.set(key, value);
  }
}

function parsePage(rawPage: string | null): AppPage {
  return rawPage === 'measure' ? 'measure' : 'devices';
}

function parseBrowser(rawBrowser: string | null): BrowserName | null {
  return rawBrowser && isBrowserName(rawBrowser) ? rawBrowser : null;
}

function isBrowserName(value: string): value is BrowserName {
  return ['chrome', 'edge', 'safari', 'firefox', 'samsungInternet'].includes(value);
}

function parseScrollbarMode(rawValue: string | null): ScrollbarMode {
  return rawValue === 'off' ? 'off' : 'on';
}

function parseFormFactorFilter(rawValue: string | null): FormFactorFilter {
  return rawValue === 'phone' || rawValue === 'tablet' || rawValue === 'desktop' ? rawValue : 'all';
}
