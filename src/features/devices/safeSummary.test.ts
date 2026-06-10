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
      id: 'mobile',
      width: 360,
      height: 459,
      maxHeight: 459,
      widthSource: 'Narrow phone',
      heightSource: 'Short phone',
      deviceCount: 2,
    });
  });

  it('splits desktops into small (≤1440), regular, large (1920+), and XL (2560+) buckets', () => {
    const summary = createSafeViewportSummary([
      createRow(
        { label: 'Budget notebook', formFactor: 'desktop', screen: { width: 1366, height: 768 } },
        { width: 1366, height: 620 },
      ),
      createRow(
        { label: 'iPad landscape', formFactor: 'tablet', orientation: 'landscape' },
        { width: 1366, height: 926 },
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
      'small-desktop',
      'desktop',
      'large-desktop',
      'xl-desktop',
    ]);
    expect(summary[0]).toMatchObject({ width: 1366, height: 620, deviceCount: 2 });
    expect(summary[1]).toMatchObject({ width: 1728, height: 985, deviceCount: 1 });
    // The 1920+ bucket includes QHD; its worst case is still the FHD monitor.
    expect(summary[2]).toMatchObject({ width: 1920, height: 932, deviceCount: 2 });
    expect(summary[3]).toMatchObject({ width: 2560, height: 1292, deviceCount: 1 });
  });

  it('omits categories without devices', () => {
    const summary = createSafeViewportSummary([
      createRow({ label: 'Phone' }, { width: 393, height: 699 }),
    ]);

    expect(summary.map((entry) => entry.id)).toEqual(['mobile']);
  });
});
