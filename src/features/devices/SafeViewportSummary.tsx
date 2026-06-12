import { useEffect, useRef, useState } from 'react';
import devicesJson from '../../data/devices.json';
import { ClearUrlButton } from '../../shared/ui/ClearUrlButton';
import { BrowserIcon } from '../../shared/ui/PlatformIcon';
import { BROWSER_OPTIONS, isBrowserAvailable } from '../profiles/constraintCatalog';
import type { DeviceDataset, FormFactor } from '../profiles/profile.types';
import type { SafeViewportEntry, SafeViewportSource } from './safeSummary';
import { createPlaceholderPageHtml, normalizeTestUrl } from './testUrl';

/** Category ids are `mobile-*`, `tablet-*`, `desktop-*` — map them to the canvas filter. */
function getEntryFormFactor(entryId: string): FormFactor {
  if (entryId.startsWith('mobile')) {
    return 'phone';
  }

  return entryId.startsWith('tablet') ? 'tablet' : 'desktop';
}

// Must stay comfortably inside the smallest .safe-summary__thumb-area so the
// preview never touches the card edges.
const THUMB_MAX_WIDTH = 112;
const THUMB_MAX_HEIGHT = 56;

const CURATED_DEVICES = (devicesJson as unknown as DeviceDataset).curated;
const DEVICE_COUNT = CURATED_DEVICES.length;

/**
 * Every device × available browser × the simulation settings that actually
 * change its numbers: desktops have bookmarks, dock position and scrollbar
 * (2 × 2 × 2), touch devices have the on-screen keyboard (× 2).
 */
const COMBINATION_COUNT = CURATED_DEVICES.reduce((total, profile) => {
  const browserCount = BROWSER_OPTIONS.filter((browser) =>
    isBrowserAvailable(profile.os.name, browser),
  ).length;
  const settingsCount = profile.formFactor === 'desktop' ? 8 : 2;
  return total + browserCount * settingsCount;
}, 0);

/** The visitor's own effective viewport — the hero demonstrates the product live. */
function useLiveViewportSize(): { width: number; height: number } {
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}

interface SafeViewportSummaryProps {
  entries: SafeViewportEntry[];
  /** Raw URL as typed — shown in the input. */
  testUrl: string;
  /** Debounced URL — rendered live inside each card. */
  previewTestUrl: string;
  onTestUrlChange: (url: string) => void;
  /** Opens the canvas with every device side by side. */
  onCompareAll: () => void;
  /** Opens the canvas filtered to one device category. */
  onOpenCategory: (formFactor: FormFactor) => void;
}

/**
 * Headline takeaway of the whole page: the worst-case effective viewport per
 * device category — test at these sizes and every curated device is covered.
 */
export function SafeViewportSummary({
  entries,
  testUrl,
  previewTestUrl,
  onTestUrlChange,
  onCompareAll,
  onOpenCategory,
}: SafeViewportSummaryProps) {
  const previewUrl = normalizeTestUrl(previewTestUrl);
  const liveViewport = useLiveViewportSize();
  const cardsIntroRef = useRef<HTMLElement>(null);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section aria-label="Worst-case viewport sizes" className="safe-summary">
      {/* The hero panel is itself a calibration frame — the product's own
          visual language (dark surface, green corner ticks, live readout). */}
      <div className="safe-summary__hero">
        <p
          className="safe-summary__live"
          title="window.innerWidth × window.innerHeight — the viewport your browser hands this page right now."
        >
          <span className="safe-summary__live-label">your effective viewport, live</span>
          <span className="safe-summary__live-size">
            {liveViewport.width} × {liveViewport.height}
          </span>
        </p>
        <h2 className="safe-summary__title">
          What do your visitors see when they first land on your page?
        </h2>
        {/* The follow-up question leads straight into the answer — one
            paragraph instead of two stacked questions. */}
        <p className="safe-summary__value">
          <strong>And can they use it comfortably?</strong> Type a URL and find out how your page
          looks in the space that&rsquo;s really left once toolbars, docks and keyboards take their
          cut.
        </p>
        {/* A real form: typing previews live in the cards, submitting opens
            the canvas with the page on every device. */}
        <form
          className="safe-summary__action"
          onSubmit={(event) => {
            event.preventDefault();
            // The canvas is a desktop tool. On phones the answer lives in the
            // cards right below — already previewing the typed URL.
            if (window.matchMedia('(max-width: 760px)').matches) {
              cardsIntroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              return;
            }
            onCompareAll();
          }}
        >
          <div className="url-field">
            {/* `type="text"` on purpose: native url validation insists on a
                scheme, while we accept bare domains and normalize ourselves. */}
            <input
              aria-label="Test URL — previewed live in the cards below"
              autoCapitalize="off"
              autoCorrect="off"
              className="safe-summary__url"
              inputMode="url"
              onChange={(event) => onTestUrlChange(event.target.value)}
              placeholder="your-website.com"
              spellCheck={false}
              type="text"
              value={testUrl}
            />
            {testUrl ? <ClearUrlButton onClear={() => onTestUrlChange('')} /> : null}
          </div>
          <button
            className="compare-all"
            title="Open every device side by side on a zoomable canvas."
            type="submit"
          >
            Find out →
          </button>
        </form>
        <ul aria-label="What backs the numbers" className="safe-summary__stats">
          <li title="Every device × its available browsers × the simulation settings that change the numbers.">
            <strong>{DEVICE_COUNT}</strong> devices · <strong>{COMBINATION_COUNT}</strong> viewport
            combinations
          </li>
          <li>measured on real devices &amp; simulators</li>
          <li>runs 100% in your browser</li>
        </ul>
      </div>
      {/* A centered moment between the hero and the cards — just the
          punchline and one hand-over line, no eyebrow, no box. */}
      <header className="section-intro safe-summary__cards-intro" ref={cardsIntroRef}>
        <h2>Every screen is smaller than it claims.</h2>
        <p className="section-intro__one-liner">
          So we boiled the {DEVICE_COUNT} devices we track down to the smallest case per category —
          one card each.
        </p>
      </header>
      <ul className="safe-summary__grid">
        {entries.map((entry) => (
          <SafeViewportCard
            entry={entry}
            key={entry.id}
            onOpen={() => onOpenCategory(getEntryFormFactor(entry.id))}
            previewUrl={previewUrl}
          />
        ))}
      </ul>
    </section>
  );
}

/**
 * Shows the smallest (svh) viewport only — the number worth designing for.
 * The scrolled (lvh) height stays available in the tooltip.
 */
function SafeViewportCard({
  entry,
  previewUrl,
  onOpen,
}: {
  entry: SafeViewportEntry;
  previewUrl: string | null;
  onOpen: () => void;
}) {
  const hasDynamicChrome = entry.maxHeight !== entry.height;
  const hasScrollbar = entry.contentWidth < entry.width;
  const scale = Math.min(THUMB_MAX_WIDTH / entry.width, THUMB_MAX_HEIGHT / entry.height);

  return (
    <li className="safe-summary__card" title={getCardTitle(entry)}>
      {/* Stretched over the whole card — the card itself is the link into
          the canvas, the content stays plain markup underneath. */}
      <button
        aria-label={`Open ${entry.label} devices in the canvas`}
        className="safe-summary__card-open"
        onClick={onOpen}
        title={`Open ${entry.label.toLowerCase()} devices side by side in the canvas.`}
        type="button"
      />
      <span className="safe-summary__category">{entry.label}</span>
      <div aria-hidden="true" className="safe-summary__thumb-area">
        <div
          className="safe-summary__thumb"
          style={{ width: entry.width * scale, height: entry.height * scale }}
        >
          {/* Rendered at the real worst-case size, scaled down — media queries
              match what this category would actually serve. */}
          <iframe
            className="safe-summary__preview"
            height={entry.height}
            style={{ transform: `scale(${scale})` }}
            tabIndex={-1}
            title={`Preview at ${entry.width} × ${entry.height}`}
            width={entry.width}
            {...(previewUrl
              ? { src: previewUrl }
              : { srcDoc: createPlaceholderPageHtml({ deviceLabel: entry.label }) })}
          />
        </div>
      </div>
      <strong className="safe-summary__size">
        {entry.width} × {entry.height}
        {hasDynamicChrome ? <small> svh</small> : null}
        {hasScrollbar ? (
          <small className="safe-summary__size-note">{entry.contentWidth} with scrollbar</small>
        ) : null}
      </strong>
      <dl className="safe-summary__source">
        {isSameSource(entry.widthSource, entry.heightSource) ? (
          <div>
            <dt>w · h</dt>
            <dd>
              <SourceLabel source={entry.widthSource} />
            </dd>
          </div>
        ) : (
          <>
            <div>
              <dt>w</dt>
              <dd>
                <SourceLabel source={entry.widthSource} />
              </dd>
            </div>
            <div>
              <dt>h</dt>
              <dd>
                <SourceLabel source={entry.heightSource} />
              </dd>
            </div>
          </>
        )}
      </dl>
    </li>
  );
}

/** Device name with the logo of the browser that drives the worst case. */
function SourceLabel({ source }: { source: SafeViewportSource }) {
  return (
    <span className="safe-summary__source-label">
      {source.deviceLabel}
      <BrowserIcon browser={source.browser} />
    </span>
  );
}

function isSameSource(a: SafeViewportSource, b: SafeViewportSource): boolean {
  return a.deviceLabel === b.deviceLabel && a.browser === b.browser;
}

function getCardTitle(entry: SafeViewportEntry): string | undefined {
  if (entry.maxHeight !== entry.height) {
    return `Grows to ${entry.width} × ${entry.maxHeight} once the browser UI collapses while scrolling (lvh).`;
  }

  if (entry.contentWidth < entry.width) {
    return `The scrollbar reserves ${entry.width - entry.contentWidth} px of page width — the layout gets ${entry.contentWidth} px, media queries still match ${entry.width}.`;
  }

  return undefined;
}
