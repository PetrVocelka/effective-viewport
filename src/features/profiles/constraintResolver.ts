import type {
  CalculationOptions,
  ConstraintDataset,
  ConstraintEntry,
  ConstraintId,
  ConstraintMeasurement,
  DeviceProfile,
  EffectiveViewportResult,
  FormFactor,
  OperatingSystem,
  ResolvedConstraint,
  ResolverContext,
} from './profile.types';

const VERSION_PATTERN = /^(>=|<=|>|<|=)?\s*([0-9]+(?:\.[0-9]+)?)/;

export function matchesVersionRange(version: string | undefined, range: string): boolean {
  if (!version) {
    return false;
  }

  const current = parseNumericVersion(version);
  const checks = range.split(/\s+/).filter(Boolean);

  return checks.every((check) => {
    const match = VERSION_PATTERN.exec(check);

    if (!match) {
      return false;
    }

    const operator = match[1] ?? '=';
    const target = Number(match[2]);

    switch (operator) {
      case '>=':
        return current >= target;
      case '<=':
        return current <= target;
      case '>':
        return current > target;
      case '<':
        return current < target;
      default:
        return current === target;
    }
  });
}

export function resolveConstraint(
  id: ConstraintId,
  profile: DeviceProfile,
  constraints: ConstraintDataset,
  context: ResolverContext = {},
): ResolvedConstraint | null {
  const resolved = resolveFromDataset(id, profile, constraints, context);
  const override = profile.constraintOverrides?.[id];

  if (override) {
    return {
      id,
      heightDip: override.heightDip,
      collapsedHeightDip: override.collapsedHeightDip ?? resolved?.collapsedHeightDip,
      bottomHeightDip: override.bottomHeightDip,
      collapsedBottomHeightDip: override.collapsedBottomHeightDip,
      axis: 'vertical',
      measuredAt: resolved?.measuredAt ?? '',
      verified: resolved?.verified ?? false,
      source: 'device-override',
      notes: override.notes ?? resolved?.notes,
    };
  }

  return resolved;
}

export function calculateEffectiveViewport(
  profile: DeviceProfile,
  constraints: ConstraintDataset,
  enabledConstraints: ConstraintId[],
  context: ResolverContext = {},
  options: CalculationOptions = {},
): EffectiveViewportResult {
  const horizontalIds = options.horizontalConstraints ?? [];
  const appliedConstraints = enabledConstraints
    .map((id) => resolveConstraint(id, profile, constraints, context))
    .filter((constraint): constraint is ResolvedConstraint => constraint !== null)
    .map((constraint) =>
      horizontalIds.includes(constraint.id)
        ? { ...constraint, axis: 'horizontal' as const }
        : constraint,
    );

  const verticalConstraints = appliedConstraints.filter(
    (constraint) => constraint.axis === 'vertical',
  );
  const horizontalConstraints = appliedConstraints.filter(
    (constraint) => constraint.axis === 'horizontal',
  );

  const totalVerticalChrome = sumThickness(verticalConstraints);
  const totalCollapsedChrome = verticalConstraints.reduce(
    (total, constraint) => total + (constraint.collapsedHeightDip ?? constraint.heightDip),
    0,
  );
  const totalHorizontalChrome = sumThickness(horizontalConstraints);
  const effectiveWidth = Math.max(0, profile.screen.width - totalHorizontalChrome);

  // The classic scrollbar is special: it sits inside the viewport (media
  // queries still match the full width), so it never reduces the viewport —
  // only the width the page layout actually receives.
  const scrollbar = options.includeScrollbar
    ? resolveConstraint('scrollbar', profile, constraints, context)
    : null;

  return {
    profile,
    viewport: {
      width: effectiveWidth,
      height: Math.max(0, profile.screen.height - totalVerticalChrome),
    },
    maxViewport: {
      width: effectiveWidth,
      height: Math.max(0, profile.screen.height - totalCollapsedChrome),
    },
    appliedConstraints,
    totalVerticalChrome,
    totalHorizontalChrome,
    scrollbar,
    contentWidth: Math.max(0, effectiveWidth - (scrollbar?.heightDip ?? 0)),
  };
}

function sumThickness(constraints: ResolvedConstraint[]): number {
  return constraints.reduce((total, constraint) => total + constraint.heightDip, 0);
}

export function getLatestProfileMeasurement(profile: DeviceProfile) {
  return [...profile.measurements].sort(sortByNewestMeasurement)[0];
}

function resolveFromDataset(
  id: ConstraintId,
  profile: DeviceProfile,
  constraints: ConstraintDataset,
  context: ResolverContext,
): ResolvedConstraint | null {
  const osEntry = constraints.os[profile.os.name]?.[id];
  const browserEntry = constraints.browser[profile.browser.name]?.[id];
  const entries = osEntry ?? browserEntry;

  if (!entries?.length) {
    return null;
  }

  const entry = selectConstraintEntry(entries, {
    os: profile.os.name,
    osVersion: context.osVersion ?? profile.os.version,
    browserVersion: context.browserVersion ?? profile.browser.version,
    formFactor: profile.formFactor,
  });

  if (!entry) {
    return null;
  }

  const measurement = selectMeasurement(entry.measurements, context.measuredAt);

  if (!measurement) {
    return null;
  }

  return {
    id,
    heightDip: measurement.heightDip,
    collapsedHeightDip: measurement.collapsedHeightDip,
    bottomHeightDip: measurement.bottomHeightDip,
    collapsedBottomHeightDip: measurement.collapsedBottomHeightDip,
    axis: 'vertical',
    measuredAt: measurement.measuredAt,
    verified: measurement.verified ?? false,
    source: measurement.source,
    notes: measurement.notes,
  };
}

interface EntrySelectionContext {
  os: OperatingSystem;
  osVersion?: string;
  browserVersion?: string;
  formFactor?: FormFactor;
}

function selectConstraintEntry(
  entries: ConstraintEntry[],
  context: EntrySelectionContext,
): ConstraintEntry | null {
  const matchingEntries = entries.filter((entry) => {
    if (!entry.appliesTo) {
      return true;
    }

    const osNameMatches = entry.appliesTo.os ? entry.appliesTo.os === context.os : true;
    const osVersionMatches = entry.appliesTo.osVersion
      ? matchesVersionRange(context.osVersion, entry.appliesTo.osVersion)
      : true;
    const browserMatches = entry.appliesTo.browserVersion
      ? matchesVersionRange(context.browserVersion, entry.appliesTo.browserVersion)
      : true;
    const formFactorMatches = entry.appliesTo.formFactor
      ? entry.appliesTo.formFactor === context.formFactor
      : true;

    return osNameMatches && osVersionMatches && browserMatches && formFactorMatches;
  });

  return (
    matchingEntries.sort((left, right) => specificityScore(right) - specificityScore(left))[0] ??
    null
  );
}

function selectMeasurement(
  measurements: ConstraintMeasurement[],
  measuredAt?: string,
): ConstraintMeasurement | null {
  if (measuredAt) {
    const historicalMeasurement = measurements.find(
      (measurement) => measurement.measuredAt === measuredAt,
    );

    if (historicalMeasurement) {
      return historicalMeasurement;
    }
  }

  return [...measurements].sort(sortByNewestMeasurement)[0] ?? null;
}

function specificityScore(entry: ConstraintEntry): number {
  return Object.keys(entry.appliesTo ?? {}).length;
}

function sortByNewestMeasurement(
  left: { measuredAt: string },
  right: { measuredAt: string },
): number {
  return new Date(right.measuredAt).getTime() - new Date(left.measuredAt).getTime();
}

function parseNumericVersion(version: string): number {
  const match = /[0-9]+(?:\.[0-9]+)?/.exec(version);

  return match ? Number(match[0]) : Number.NaN;
}
