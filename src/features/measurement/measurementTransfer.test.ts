import { describe, expect, it } from 'vitest';
import { createImportUrl, decodeImportPayload } from './measurementTransfer';
import type { ViewportMeasurement } from './viewportMeasurement';

const measurement: ViewportMeasurement = {
  innerWidth: 1494,
  innerHeight: 802,
  outerWidth: 1512,
  outerHeight: 889,
  screenWidth: 1512,
  screenHeight: 982,
  availableWidth: 1512,
  availableHeight: 950,
  smallViewportHeight: 802,
  largeViewportHeight: 802,
  devicePixelRatio: 2,
  orientation: 'landscape',
  measuredAt: '2026-06-10T12:00:00.000Z',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/131 — žluťoučký kůň',
  detectedOS: 'macos',
  detectedBrowser: 'chrome',
  osVersion: '14.6.1',
  browserVersion: '131.0.6778.86',
  versionSource: 'clientHints',
  environment: 'hardware',
  estimatedOsChromeHeight: 32,
  estimatedBrowserChromeHeight: 87,
  scrollbarWidth: 0,
  safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
  zoomWarning: null,
};

describe('measurement transfer', () => {
  it('round-trips a measurement through the import URL', () => {
    const url = createImportUrl(measurement, true, 'https://example.dev/');
    const rawPayload = new URL(url).searchParams.get('import');

    expect(rawPayload).toBeTruthy();

    const decoded = decodeImportPayload(rawPayload ?? '');

    expect(decoded?.edgeToEdgeConfirmed).toBe(true);
    expect(decoded?.measurement).toEqual(measurement);
  });

  it('rejects malformed payloads', () => {
    expect(decodeImportPayload('not-base64!!!')).toBeNull();
    expect(decodeImportPayload(btoa(JSON.stringify({ v: 99 })))).toBeNull();
    expect(decodeImportPayload(btoa(JSON.stringify({ v: 1, e: true, m: {} })))).toBeNull();
  });
});
