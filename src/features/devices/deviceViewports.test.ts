import { describe, expect, it } from 'vitest';
import type { ConstraintDataset, DeviceProfile } from '../profiles/profile.types';
import { createDeviceViewportRow } from './deviceViewports';

const constraints: ConstraintDataset = {
  schemaVersion: 2,
  os: {
    ios: {
      keyboard: [
        {
          appliesTo: { formFactor: 'tablet' },
          measurements: [
            {
              heightDip: 320,
              bottomHeightDip: 320,
              measuredAt: '2026-06-12T00:00:00Z',
              verified: false,
            },
          ],
        },
        {
          measurements: [
            {
              heightDip: 291,
              bottomHeightDip: 291,
              measuredAt: '2026-06-12T00:00:00Z',
              verified: false,
            },
          ],
        },
      ],
    },
  },
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
  keyboardMode: 'closed',
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

  it('subtracts the on-screen keyboard only when opted in', () => {
    const closedRow = createDeviceViewportRow(iphone, constraints, {
      ...defaultSettings,
      browser: 'safari',
    });
    const openRow = createDeviceViewportRow(iphone, constraints, {
      ...defaultSettings,
      browser: 'safari',
      keyboardMode: 'open',
    });

    expect(closedRow.result.viewport.height).toBe(852 - 193);
    expect(openRow.result.viewport.height).toBe(852 - 193 - 291);
  });

  it('picks the tablet keyboard entry for tablets and skips desktops entirely', () => {
    const ipad: DeviceProfile = {
      ...iphone,
      id: 'test-ipad',
      formFactor: 'tablet',
      screen: { width: 834, height: 1194 },
    };
    const desktop: DeviceProfile = {
      ...iphone,
      id: 'test-desktop',
      formFactor: 'desktop',
      os: { name: 'macos' },
      screen: { width: 1512, height: 982 },
      constraints: [],
    };

    const ipadRow = createDeviceViewportRow(ipad, constraints, {
      ...defaultSettings,
      browser: 'safari',
      keyboardMode: 'open',
    });
    const desktopRow = createDeviceViewportRow(desktop, constraints, {
      ...defaultSettings,
      browser: 'safari',
      keyboardMode: 'open',
    });

    expect(
      ipadRow.result.appliedConstraints.find((constraint) => constraint.id === 'keyboard')
        ?.heightDip,
    ).toBe(320);
    expect(
      desktopRow.result.appliedConstraints.some((constraint) => constraint.id === 'keyboard'),
    ).toBe(false);
  });
});
