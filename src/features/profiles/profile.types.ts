export type ProfileKind = 'named' | 'edgeCase' | 'reference';

export type FormFactor = 'phone' | 'tablet' | 'desktop';

export type Orientation = 'landscape' | 'portrait';

export type OperatingSystem = 'macos' | 'windows' | 'ios' | 'android' | 'linux' | 'chromeos';

export type BrowserName = 'chrome' | 'edge' | 'safari' | 'firefox' | 'samsungInternet';

export type ConstraintId =
  | 'menuBar'
  | 'dock'
  | 'taskbar'
  | 'shelf'
  | 'topChrome'
  | 'bookmarksBar'
  | 'scrollbar';

export interface Size {
  width: number;
  height: number;
}

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ConstraintOverride {
  heightDip: number;
  collapsedHeightDip?: number;
  /** Portion of heightDip that sits at the bottom screen edge (mobile bottom bars). */
  bottomHeightDip?: number;
  /** Portion of collapsedHeightDip that stays at the bottom edge while scrolling. */
  collapsedBottomHeightDip?: number;
  notes?: string;
}

export interface ProfileMeasurement {
  effectiveViewport: Size;
  measuredAt: string;
  verified: boolean;
  source?: string;
  notes?: string;
}

export interface DeviceProfile {
  id: string;
  kind: ProfileKind;
  formFactor: FormFactor;
  label: string;
  vendor?: string;
  diagonalInches?: number;
  aspectRatio: string;
  dpr: number;
  orientation: Orientation;
  os: {
    name: OperatingSystem;
    version?: string;
  };
  browser: {
    name: BrowserName;
    version?: string;
  };
  screen: Size;
  assumedLogicalResolution?: Size;
  constraints: ConstraintId[];
  /**
   * Hardware-specific chrome heights that differ from the OS/browser-wide default,
   * e.g. the taller menu bar on MacBooks with a notch or the smaller status bar
   * on non-notch iPhones.
   */
  constraintOverrides?: Partial<Record<ConstraintId, ConstraintOverride>>;
  safeAreaInsets?: SafeAreaInsets;
  measurements: ProfileMeasurement[];
  notes?: string;
}

export interface DeviceDataset {
  schemaVersion: number;
  curated: DeviceProfile[];
  measured: DeviceProfile[];
}

export interface VersionApplicability {
  os?: OperatingSystem;
  osVersion?: string;
  browserVersion?: string;
  /** Restricts the entry to a device class (e.g. tablet Chrome keeps a tab strip). */
  formFactor?: FormFactor;
}

export interface ConstraintMeasurement {
  heightDip: number;
  /**
   * Height of the same UI once the browser collapses it while scrolling
   * (mobile URL bars / toolbars). Absent on desktop where chrome is static.
   */
  collapsedHeightDip?: number;
  /**
   * Portion of heightDip that sits at the bottom screen edge — e.g. the Safari
   * tab bar or the Chrome iOS toolbar. The rest renders at the top.
   */
  bottomHeightDip?: number;
  /** Portion of collapsedHeightDip that stays at the bottom edge while scrolling. */
  collapsedBottomHeightDip?: number;
  measuredAt: string;
  verified?: boolean;
  source?: string;
  notes?: string;
}

export interface ConstraintEntry {
  appliesTo?: VersionApplicability;
  includes?: string[];
  measurements: ConstraintMeasurement[];
}

export interface ConstraintDataset {
  schemaVersion: number;
  os: Partial<Record<OperatingSystem, Partial<Record<ConstraintId, ConstraintEntry[]>>>>;
  browser: Partial<Record<BrowserName, Partial<Record<ConstraintId, ConstraintEntry[]>>>>;
}

export interface ResolverContext {
  osVersion?: string;
  browserVersion?: string;
  measuredAt?: string;
}

export interface ResolvedConstraint {
  id: ConstraintId;
  /** Thickness of the UI element in dip — vertical bars take it from the width instead. */
  heightDip: number;
  collapsedHeightDip?: number;
  /** Portion of heightDip rendered at the bottom screen edge. */
  bottomHeightDip?: number;
  /** Portion of collapsedHeightDip that stays at the bottom edge while scrolling. */
  collapsedBottomHeightDip?: number;
  /** Which viewport dimension the constraint reduces. */
  axis: 'vertical' | 'horizontal';
  measuredAt: string;
  verified: boolean;
  source?: string;
  notes?: string;
}

export interface EffectiveViewportResult {
  profile: DeviceProfile;
  /** Defensive minimum: all enabled chrome visible / expanded. */
  viewport: Size;
  /** Best case once collapsible chrome (mobile toolbars) hides while scrolling. */
  maxViewport: Size;
  appliedConstraints: ResolvedConstraint[];
  totalVerticalChrome: number;
  /** Width taken by OS bars docked to the left or right edge. */
  totalHorizontalChrome: number;
  /**
   * Classic (non-overlay) scrollbar rendered inside the viewport. It does not
   * reduce the viewport — media queries and vw units still see the full width —
   * but the page layout does not get that space.
   */
  scrollbar: ResolvedConstraint | null;
  /** viewport.width minus the classic scrollbar — what the layout actually receives. */
  contentWidth: number;
}

export interface CalculationOptions {
  /** Constraints applied to the width axis (Dock or taskbar moved to a side edge). */
  horizontalConstraints?: ConstraintId[];
  /** Whether a classic scrollbar takes layout width inside the viewport. */
  includeScrollbar?: boolean;
}
