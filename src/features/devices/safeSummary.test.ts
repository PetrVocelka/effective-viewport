import { describe, expect, it } from 'vitest';
import type { DeviceProfile } from '../profiles/profile.types';
import type { DeviceViewportRow } from './deviceViewports';
import { createSafeViewportSummary } from './safeSummary';

function createRow(
  overrides: Partial<DeviceProfile> & { label: string },
  viewport: { width: number; height: number },
): DeviceViewportRow {
  const profile = {
    id: overrides.label,
    formFactor: 'phone',
    orientation: 'portrait',
    screen: { width: viewport.width, height: viewport.height },
    ...overrides,
  } as DeviceProfile;

  return {
    profile,
    browser: 'chrome',
    isVerified: false,
    hasDynamicChrome: false,
    result: {
      profile,
      viewport,
      maxViewport: viewport,
      totalVerticalChrome: 0,
      totalHorizontalChrome: 0,
      appliedConstraints: [],
      scrollbar: null,
      contentWidth: viewport.width,
    },
  };
}

describe('createSafeViewportSummary', () => {
  it('picks the smallest width and height per category, possibly from different devices', () => {
    const summary = createSafeViewportSummary([
      createRow({ label: 'Narrow phone' }, { width: 360, height: 700 }),
      createRow({ label: 'Short phone' }, { width: 375, height: 459 }),
    ]);

    expect(summary).toHaveLength(1);
    expect(summary[0]).toMatchObject({
      id: 'mobile-portrait',
      width: 360,
      height: 459,
      maxHeight: 459,
      widthSource: { deviceLabel: 'Narrow phone', browser: 'chrome' },
      heightSource: { deviceLabel: 'Short phone', browser: 'chrome' },
      deviceCount: 2,
    });
  });

  it('takes the worst case across browsers of the same device, counting the device once', () => {
    const chromeRow = createRow({ label: 'Phone' }, { width: 360, height: 700 });
    const samsungRow = {
      ...createRow({ label: 'Phone' }, { width: 360, height: 644 }),
      browser: 'samsungInternet' as const,
    };

    const summary = createSafeViewportSummary([chromeRow, samsungRow]);

    expect(summary[0]).toMatchObject({
      height: 644,
      heightSource: { deviceLabel: 'Phone', browser: 'samsungInternet' },
      deviceCount: 1,
    });
  });

  it('splits phones and tablets by orientation', () => {
    const summary = createSafeViewportSummary([
      createRow({ label: 'Phone portrait' }, { width: 360, height: 700 }),
      createRow(
        { label: 'Phone landscape', orientation: 'landscape' },
        { width: 800, height: 240 },
      ),
      createRow({ label: 'Tablet portrait', formFactor: 'tablet' }, { width: 744, height: 1053 }),
      createRow(
        { label: 'Tablet landscape', formFactor: 'tablet', orientation: 'landscape' },
        { width: 1194, height: 754 },
      ),
    ]);

    expect(summary.map((entry) => entry.id)).toEqual([
      'mobile-portrait',
      'mobile-landscape',
      'tablet-portrait',
      'tablet-landscape',
    ]);
  });

  it('splits desktops into small (≤1440), medium, large (1920+), and XL (2560+) buckets', () => {
    const summary = createSafeViewportSummary([
      createRow(
        { label: 'Budget notebook', formFactor: 'desktop', screen: { width: 1366, height: 768 } },
        { width: 1366, height: 620 },
      ),
      createRow(
        { label: 'MacBook 16', formFactor: 'desktop', screen: { width: 1728, height: 1117 } },
        { width: 1728, height: 985 },
      ),
      createRow(
        { label: 'FHD monitor', formFactor: 'desktop', screen: { width: 1920, height: 1080 } },
        { width: 1920, height: 932 },
      ),
      createRow(
        { label: 'QHD monitor', formFactor: 'desktop', screen: { width: 2560, height: 1440 } },
        { width: 2560, height: 1292 },
      ),
    ]);

    expect(summary.map((entry) => entry.id)).toEqual([
      'desktop-small',
      'desktop-medium',
      'desktop-large',
      'desktop-xl',
    ]);
    expect(summary[0]).toMatchObject({ width: 1366, height: 620, deviceCount: 1 });
    expect(summary[1]).toMatchObject({ width: 1728, height: 985, deviceCount: 1 });
    expect(summary[2]).toMatchObject({ width: 1920, height: 932, deviceCount: 1 });
    expect(summary[3]).toMatchObject({ width: 2560, height: 1292, deviceCount: 1 });
  });

  it('omits categories without devices', () => {
    const summary = createSafeViewportSummary([
      createRow({ label: 'Phone' }, { width: 393, height: 699 }),
    ]);

    expect(summary.map((entry) => entry.id)).toEqual(['mobile-portrait']);
  });
});
