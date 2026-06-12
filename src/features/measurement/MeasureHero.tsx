import { BrandLockup } from '../../shared/ui/BrandLockup';
import type { AutoreportStatus } from './useAutoreport';
import type { ViewportMeasurement } from './viewportMeasurement';

interface MeasureHeroProps {
  measurement: ViewportMeasurement | null;
  autoreportStatus: AutoreportStatus;
  /** Hidden in capture mode — calibration screenshots stay clean. */
  onExit?: () => void;
  /** Scrolls to the contribution flow below the fold. Hidden in capture mode. */
  onSubmitMeasurement?: () => void;
}

/**
 * Fills exactly 100svh — the guaranteed above-the-fold area. The 1px frame
 * with corner ticks doubles as a calibration pattern: OS-level screenshots
 * can be measured against it to verify browser and OS chrome heights.
 */
export function MeasureHero({
  measurement,
  autoreportStatus,
  onExit,
  onSubmitMeasurement,
}: MeasureHeroProps) {
  return (
    <section aria-labelledby="measure-hero-title" className="measure-hero">
      <div aria-hidden="true" className="measure-hero__frame" />

      <header className="measure-hero__header">
        <BrandLockup tagline="Measure what really fits above the fold." />
        {onExit ? (
          <button
            aria-label="Back to the device reference"
            className="measure-hero__close"
            onClick={onExit}
            title="Back to the device reference"
            type="button"
          >
            <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 16 16" width="15">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.6"
              />
            </svg>
          </button>
        ) : null}
      </header>

      <div className="measure-hero__center">
        <p className="eyebrow">Live measurement</p>
        <h2 id="measure-hero-title">Your effective viewport, right now</h2>
        <p className="measure-hero__metric">
          {measurement ? `${measurement.innerWidth} × ${measurement.innerHeight}` : '— × —'}
        </p>
        {measurement ? (
          <dl className="measure-hero__facts">
            <HeroFact label="Height range" value={formatHeightRange(measurement)} />
            <HeroFact label="Screen" value={formatScreen(measurement)} />
            <HeroFact label="Platform" value={formatPlatform(measurement)} />
            <HeroFact label="Browser" value={formatBrowser(measurement)} />
            {hasSafeAreas(measurement) ? (
              <HeroFact label="Safe areas" value={formatSafeAreas(measurement)} />
            ) : null}
          </dl>
        ) : null}
        {onSubmitMeasurement ? (
          <button className="measure-hero__submit" onClick={onSubmitMeasurement} type="button">
            Submit this measurement
            <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 14 14" width="14">
              <path
                d="M7 2v10m0 0l4-4m-4 4L3 8"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        ) : null}
      </div>

      <footer className="measure-hero__fold">
        <p className="measure-hero__fold-label">
          This page fills the small viewport (100svh) — everything above this line is above the
          fold.
        </p>
        {autoreportStatus !== 'off' ? (
          <p className="measure-hero__report-status" data-status={autoreportStatus}>
            {AUTOREPORT_LABELS[autoreportStatus]}
          </p>
        ) : null}
      </footer>
    </section>
  );
}

const AUTOREPORT_LABELS: Record<Exclude<AutoreportStatus, 'off'>, string> = {
  reporting: 'reporting…',
  reported: 'reported ✓',
  failed: 'report failed ✗',
};

function formatHeightRange(measurement: ViewportMeasurement): string {
  const { smallViewportHeight, largeViewportHeight } = measurement;

  if (smallViewportHeight === null || largeViewportHeight === null) {
    return `${measurement.innerHeight} px`;
  }

  if (Math.round(smallViewportHeight) === Math.round(largeViewportHeight)) {
    return `${Math.round(smallViewportHeight)} px (static)`;
  }

  return `${Math.round(smallViewportHeight)}–${Math.round(largeViewportHeight)} px (svh–lvh)`;
}

function formatScreen(measurement: ViewportMeasurement): string {
  return `${measurement.screenWidth} × ${measurement.screenHeight} @ ${measurement.devicePixelRatio}×`;
}

function formatPlatform(measurement: ViewportMeasurement): string {
  const base =
    measurement.detectedOS === 'unknown' ? 'unknown OS' : OS_LABELS[measurement.detectedOS];
  const suffix = measurement.environment === 'emulator' ? ' (emulator)' : '';

  return `${withVersion(base, measurement.osVersion)}${suffix}`;
}

function formatBrowser(measurement: ViewportMeasurement): string {
  const base =
    measurement.detectedBrowser === 'unknown'
      ? 'unknown browser'
      : BROWSER_LABELS[measurement.detectedBrowser];

  return withVersion(base, measurement.browserVersion);
}

function withVersion(label: string, version: string | null): string {
  return version ? `${label} ${version}` : label;
}

function hasSafeAreas(measurement: ViewportMeasurement): boolean {
  const { top, right, bottom, left } = measurement.safeAreaInsets;

  return top + right + bottom + left > 0;
}

function formatSafeAreas(measurement: ViewportMeasurement): string {
  const { top, bottom } = measurement.safeAreaInsets;

  return `top ${top} px · bottom ${bottom} px`;
}

const OS_LABELS: Record<Exclude<ViewportMeasurement['detectedOS'], 'unknown'>, string> = {
  macos: 'macOS',
  windows: 'Windows',
  ios: 'iOS',
  android: 'Android',
  linux: 'Linux',
  chromeos: 'ChromeOS',
};

const BROWSER_LABELS: Record<Exclude<ViewportMeasurement['detectedBrowser'], 'unknown'>, string> = {
  chrome: 'Chrome',
  edge: 'Edge',
  safari: 'Safari',
  firefox: 'Firefox',
  samsungInternet: 'Samsung Internet',
};

interface HeroFactProps {
  label: string;
  value: string;
}

function HeroFact({ label, value }: HeroFactProps) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}
