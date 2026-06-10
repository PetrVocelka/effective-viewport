import type { ConstraintId, DeviceProfile, ResolvedConstraint } from '../profiles/profile.types';

interface PresetTitleOptions {
  /** Marks presets sized to the scrolled (collapsed-chrome, lvh) viewport. */
  isScrolled?: boolean;
}

/**
 * Device name for the Chrome DevTools "Add custom device" form. Prefixed so
 * the presets group together in the device list. Built from the constraints
 * actually applied, so simulation settings (side dock, hidden bookmarks…)
 * show up in the name and match the width/height next to it.
 */
export function createPresetTitle(
  profile: DeviceProfile,
  appliedConstraints: Pick<ResolvedConstraint, 'id' | 'axis'>[],
  options: PresetTitleOptions = {},
): string {
  const constraintLabel = appliedConstraints.length
    ? appliedConstraints.map(formatConstraintLabel).join(' + ')
    : 'No browser UI';
  const scrolledSuffix = options.isScrolled ? ' · scrolled' : '';

  return `[EFV] ${profile.label} (${constraintLabel}${scrolledSuffix})`;
}

function formatConstraintLabel({ id, axis }: Pick<ResolvedConstraint, 'id' | 'axis'>): string {
  const labels: Record<ConstraintId, string> = {
    menuBar: 'Menu bar',
    dock: 'Dock',
    taskbar: 'Taskbar',
    shelf: 'Shelf',
    topChrome: 'Browser UI',
    bookmarksBar: 'Bookmarks',
    scrollbar: 'Scrollbar',
  };

  // OS bars docked to the side eat width instead of height — call it out.
  return axis === 'horizontal' ? `Side ${labels[id].toLowerCase()}` : labels[id];
}
