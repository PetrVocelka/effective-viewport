import { describe, expect, it } from 'vitest';
import { createDeviceProfileEntry, createMeasurementEntry } from './datasetEntry';
import type { QueuedMeasurement } from './measurementQueue';

const queuedEntry: QueuedMeasurement = {
  id: 'test-id',
  savedAt: '2026-06-10T12:05:00.000Z',
  deviceName: 'Mall kiosk Praha',
  edgeToEdgeConfirmed: true,
  measurement: {
    innerWidth: 1080,
    innerHeight: 1820,
    outerWidth: 1080,
    outerHeight: 1920,
    screenWidth: 1080,
    screenHeight: 1920,
    availableWidth: 1080,
    availableHeight: 1920,
    smallViewportHeight: 1820,
    largeViewportHeight: 1876,
    devicePixelRatio: 1,
    orientation: 'portrait',
    measuredAt: '2026-06-10T11:50:00.000Z',
    userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/130.0.0.0 Mobile Safari/537.36',
    detectedOS: 'android',
    detectedBrowser: 'chrome',
    osVersion: '13',
    browserVersion: '130.0.6723.58',
    versionSource: 'clientHints',
    environment: 'hardware',
    estimatedOsChromeHeight: 0,
    estimatedBrowserChromeHeight: 100,
    scrollbarWidth: 0,
    safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
    zoomWarning: null,
  },
};

describe('createMeasurementEntry', () => {
  it('maps the queued measurement to a devices.json measurement entry', () => {
    expect(createMeasurementEntry(queuedEntry)).toEqual({
      effectiveViewport: { width: 1080, height: 1820 },
      smallViewportHeight: 1820,
      largeViewportHeight: 1876,
      measuredAt: '2026-06-10T11:50:00.000Z',
      osVersion: '13',
      browserVersion: '130.0.6723.58',
      environment: 'hardware',
      verified: true,
      source: 'field-measurement',
      notes: 'Mall kiosk Praha',
    });
  });

  it('keeps unconfirmed measurements unverified', () => {
    const entry = createMeasurementEntry({ ...queuedEntry, edgeToEdgeConfirmed: false });

    expect(entry.verified).toBe(false);
  });
});

describe('createDeviceProfileEntry', () => {
  it('creates a full reviewable profile for a new device', () => {
    const profile = createDeviceProfileEntry(queuedEntry);

    expect(profile.id).toBe('mall-kiosk-praha');
    expect(profile.formFactor).toBe('desktop');
    expect(profile.aspectRatio).toBe('9:16');
    expect(profile.os).toEqual({ name: 'android', version: '13' });
    expect(profile.browser).toEqual({ name: 'chrome', version: '130' });
    expect(profile.screen).toEqual({ width: 1080, height: 1920 });
    expect(profile.constraints).toEqual(['topChrome']);
    expect(profile.measurements).toHaveLength(1);
  });
});
