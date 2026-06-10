import type { SafeViewportEntry } from './safeSummary';

const THUMB_MAX_WIDTH = 150;
const THUMB_MAX_HEIGHT = 84;

interface SafeViewportSummaryProps {
  entries: SafeViewportEntry[];
}

/**
 * Headline takeaway of the whole page: the worst-case effective viewport per
 * device category — test at these sizes and every curated device is covered.
 */
export function SafeViewportSummary({ entries }: SafeViewportSummaryProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section aria-label="Worst-case viewport sizes" className="panel safe-summary">
      <div className="safe-summary__intro">
        <h2>Reality-check your design</h2>
        <p>
          Design as you always do — then check it against these. One worst case per category:
          what is really left once toolbars, docks, address bars and scrollbars take their cut.
          Not breaking is the easy part —{' '}
          <strong>
            the real question is what still makes it above the fold at these sizes: the headline,
            the value, the call to action.
          </strong>
        </p>
      </div>
      <ul className="safe-summary__grid">
        {entries.map((entry) => (
          <SafeViewportCard entry={entry} key={entry.id} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Shows the smallest (svh) viewport only — the number worth designing for.
 * The scrolled (lvh) height stays available in the tooltip.
 */
function SafeViewportCard({ entry }: { entry: SafeViewportEntry }) {
  const hasDynamicChrome = entry.maxHeight !== entry.height;
  const hasScrollbar = entry.contentWidth < entry.width;
  const scale = Math.min(THUMB_MAX_WIDTH / entry.width, THUMB_MAX_HEIGHT / entry.height);

  return (
    <li className="safe-summary__card" title={getCardTitle(entry)}>
      <span className="safe-summary__category">{entry.label}</span>
      <div aria-hidden="true" className="safe-summary__thumb-area">
        <div
          className="safe-summary__thumb"
          style={{ width: entry.width * scale, height: entry.height * scale }}
        />
      </div>
      <strong className="safe-summary__size">
        {entry.width} × {entry.height}
        {hasDynamicChrome ? <small> svh</small> : null}
        {hasScrollbar ? (
          <small className="safe-summary__size-note">{entry.contentWidth} with scrollbar</small>
        ) : null}
      </strong>
      <dl className="safe-summary__source">
        {entry.widthSource === entry.heightSource ? (
          <div>
            <dt>w · h</dt>
            <dd>{entry.widthSource}</dd>
          </div>
        ) : (
          <>
            <div>
              <dt>w</dt>
              <dd>{entry.widthSource}</dd>
            </div>
            <div>
              <dt>h</dt>
              <dd>{entry.heightSource}</dd>
            </div>
          </>
        )}
      </dl>
    </li>
  );
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
