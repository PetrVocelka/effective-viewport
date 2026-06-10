import { describe, expect, it } from 'vitest';
import {
  calculateEffectiveViewport,
  matchesVersionRange,
  resolveConstraint,
} from './constraintResolver';
import type { ConstraintDataset, DeviceProfile } from './profile.types';

const profile: DeviceProfile = {
  id: 'test-profile',
  kind: 'reference',
  formFactor: 'desktop',
  label: 'Test profile',
  aspectRatio: '16:10',
  dpr: 1,
  orientation: 'landscape',
  os: { name: 'windows', version: '11' },
  browser: { name: 'chrome', version: '120' },
  screen: { width: 1440, height: 900 },
  constraints: ['taskbar', 'topChrome'],
  measurements: [
    {
      effectiveViewport: { width: 1440, height: 772 },
      measuredAt: '2026-01-01T00:00:00Z',
      verified: true,
    },
  ],
};

const constraints: ConstraintDataset = {
  schemaVersion: 1,
  os: {
    windows: {
      scrollbar: [
        {
          measurements: [{ heightDip: 15, measuredAt: '2026-01-01T00:00:00Z' }],
        },
      ],
      taskbar: [
        {
          appliesTo: { osVersion: '>=11' },
          measurements: [
            { heightDip: 44, measuredAt: '2025-01-01T00:00:00Z', verified: true },
            { heightDip: 48, measuredAt: '2026-01-01T00:00:00Z', verified: true },
          ],
        },
        {
          measurements: [{ heightDip: 40, measuredAt: '2024-01-01T00:00:00Z' }],
        },
      ],
    },
  },
  browser: {
    chrome: {
      topChrome: [
        {
          appliesTo: { os: 'android', formFactor: 'tablet' },
          measurements: [{ heightDip: 120, measuredAt: '2026-01-01T00:00:00Z' }],
        },
        {
          appliesTo: { os: 'android' },
          measurements: [
            { heightDip: 80, collapsedHeightDip: 24, measuredAt: '2026-01-01T00:00:00Z' },
          ],
        },
        {
          appliesTo: { browserVersion: '>=120' },
          measurements: [{ heightDip: 80, measuredAt: '2026-01-01T00:00:00Z' }],
        },
        {
          measurements: [{ heightDip: 72, measuredAt: '2024-01-01T00:00:00Z' }],
        },
      ],
    },
  },
};

const androidProfile: DeviceProfile = {
  ...profile,
  id: 'test-android',
  formFactor: 'phone',
  os: { name: 'android', version: '15' },
  screen: { width: 360, height: 800 },
  constraints: ['topChrome'],
  orientation: 'portrait',
};

describe('matchesVersionRange', () => {
  it('supports simple semver-like range checks', () => {
    expect(matchesVersionRange('11', '>=10 <12')).toBe(true);
    expect(matchesVersionRange('9', '>=10 <12')).toBe(false);
  });
});

describe('resolveConstraint', () => {
  it('selects the most specific matching entry and latest measurement by default', () => {
    const constraint = resolveConstraint('taskbar', profile, constraints);

    expect(constraint?.heightDip).toBe(48);
    expect(constraint?.measuredAt).toBe('2026-01-01T00:00:00Z');
  });

  it('can resolve a historical measurement when available', () => {
    const constraint = resolveConstraint('taskbar', profile, constraints, {
      measuredAt: '2025-01-01T00:00:00Z',
    });

    expect(constraint?.heightDip).toBe(44);
  });

  it('falls back to a default entry when version-specific data does not match', () => {
    const legacyProfile = {
      ...profile,
      os: { name: 'windows', version: '8' },
    } satisfies DeviceProfile;
    const constraint = resolveConstraint('taskbar', legacyProfile, constraints);

    expect(constraint?.heightDip).toBe(40);
  });

  it('prefers an OS-specific browser entry over generic ones', () => {
    const constraint = resolveConstraint('topChrome', androidProfile, constraints);

    expect(constraint?.heightDip).toBe(80);
    expect(constraint?.collapsedHeightDip).toBe(24);
  });

  it('prefers a form-factor-specific entry on matching devices only', () => {
    const tabletProfile = {
      ...androidProfile,
      formFactor: 'tablet',
    } satisfies DeviceProfile;
    const tabletConstraint = resolveConstraint('topChrome', tabletProfile, constraints);
    const phoneConstraint = resolveConstraint('topChrome', androidProfile, constraints);

    expect(tabletConstraint?.heightDip).toBe(120);
    expect(tabletConstraint?.collapsedHeightDip).toBeUndefined();
    expect(phoneConstraint?.heightDip).toBe(80);
  });

  it('applies device-level constraint overrides', () => {
    const notchProfile = {
      ...profile,
      constraintOverrides: { taskbar: { heightDip: 56 } },
    } satisfies DeviceProfile;
    const constraint = resolveConstraint('taskbar', notchProfile, constraints);

    expect(constraint?.heightDip).toBe(56);
    expect(constraint?.source).toBe('device-override');
  });
});

describe('calculateEffectiveViewport', () => {
  it('subtracts enabled vertical constraints from the screen height', () => {
    const result = calculateEffectiveViewport(profile, constraints, ['taskbar', 'topChrome']);

    expect(result.viewport).toEqual({ width: 1440, height: 772 });
    expect(result.totalVerticalChrome).toBe(128);
  });

  it('reports static chrome as an identical min and max viewport', () => {
    const result = calculateEffectiveViewport(profile, constraints, ['taskbar', 'topChrome']);

    expect(result.maxViewport).toEqual(result.viewport);
  });

  it('uses collapsed chrome heights for the max viewport on mobile', () => {
    const result = calculateEffectiveViewport(androidProfile, constraints, ['topChrome']);

    expect(result.viewport).toEqual({ width: 360, height: 720 });
    expect(result.maxViewport).toEqual({ width: 360, height: 776 });
  });

  it('subtracts side-docked OS bars from the width instead of the height', () => {
    const result = calculateEffectiveViewport(
      profile,
      constraints,
      ['taskbar', 'topChrome'],
      {},
      { horizontalConstraints: ['taskbar'] },
    );

    expect(result.viewport).toEqual({ width: 1440 - 48, height: 900 - 80 });
    expect(result.totalVerticalChrome).toBe(80);
    expect(result.totalHorizontalChrome).toBe(48);

    const taskbar = result.appliedConstraints.find((constraint) => constraint.id === 'taskbar');
    expect(taskbar?.axis).toBe('horizontal');
  });

  it('reports the classic scrollbar as lost content width, not a smaller viewport', () => {
    const result = calculateEffectiveViewport(
      profile,
      constraints,
      ['taskbar', 'topChrome'],
      {},
      { includeScrollbar: true },
    );

    expect(result.viewport.width).toBe(1440);
    expect(result.contentWidth).toBe(1440 - 15);
    expect(result.scrollbar?.heightDip).toBe(15);
  });

  it('keeps contentWidth equal to the viewport width without a classic scrollbar', () => {
    const result = calculateEffectiveViewport(profile, constraints, ['taskbar', 'topChrome']);

    expect(result.scrollbar).toBeNull();
    expect(result.contentWidth).toBe(result.viewport.width);
  });
});
