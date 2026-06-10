import { describe, expect, it } from 'vitest';
import type { ConstraintDataset, DeviceProfile } from '../profiles/profile.types';
import { createDeviceViewportRow } from './deviceViewports';

const constraints: ConstraintDataset = {
  schemaVersion: 2,
  os: {},
  browser: {
    safari: {
      topChrome: [
        {
          appliesTo: { os: 'ios' },
          measurements: [
            {
              heightDip: 193,
              collapsedHeightDip: 113,
              measuredAt: '2026-06-10T00:00:00Z',
              verified: false,
            },
          ],
        },
      ],
    },
    chrome: {
      topChrome: [
        {
          appliesTo: { os: 'ios' },
          measurements: [
            {
              heightDip: 153,
              collapsedHeightDip: 59,
              measuredAt: '2026-06-10T00:00:00Z',
              verified: false,
            },
          ],
        },
      ],
    },
  },
};

const iphone: DeviceProfile = {
  id: 'test-iphone',
  kind: 'named',
  formFactor: 'phone',
  label: 'Test iPhone',
  aspectRatio: '9:19.5',
  dpr: 3,
  orientation: 'portrait',
  os: { name: 'ios' },
  browser: { name: 'safari' },
  screen: { width: 393, height: 852 },
  constraints: ['topChrome'],
  measurements: [],
};

const defaultSettings = {
  showBookmarksBar: false,
  osBarPosition: 'bottom',
  scrollbarMode: 'off',
} as const;

describe('createDeviceViewportRow', () => {
  it('simulates the selected browser on mobile devices too', () => {
    const safariRow = createDeviceViewportRow(iphone, constraints, {
      ...defaultSettings,
      browser: 'safari',
    });
    const chromeRow = createDeviceViewportRow(iphone, constraints, {
      ...defaultSettings,
      browser: 'chrome',
    });

    expect(safariRow.result.viewport.height).toBe(852 - 193);
    expect(chromeRow.browser).toBe('chrome');
    expect(chromeRow.result.viewport.height).toBe(852 - 153);
  });

  it('drops native-browser topChrome overrides when simulating another browser', () => {
    const iphoneWithOverride: DeviceProfile = {
      ...iphone,
      constraintOverrides: {
        topChrome: { heightDip: 114, collapsedHeightDip: 40 },
      },
    };

    const safariRow = createDeviceViewportRow(iphoneWithOverride, constraints, {
      ...defaultSettings,
      browser: 'safari',
    });
    const chromeRow = createDeviceViewportRow(iphoneWithOverride, constraints, {
      ...defaultSettings,
      browser: 'chrome',
    });

    expect(safariRow.result.viewport.height).toBe(852 - 114);
    expect(chromeRow.result.viewport.height).toBe(852 - 153);
  });
});
