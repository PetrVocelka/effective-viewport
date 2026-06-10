import { type PointerEvent, useState } from 'react';
import { CONSTRAINT_LABELS } from '../profiles/constraintCatalog';
import type { ConstraintId, ResolvedConstraint } from '../profiles/profile.types';
import type { DeviceViewportRow } from './deviceViewports';
import { PLACEHOLDER_PAGE_HTML } from './testUrl';

const MAX_FRAME_HEIGHT = 360;
const MAX_FRAME_WIDTH = 480;
/** Strips thinner than this (in rendered px) hide their inline label. */
const MIN_LABEL_HEIGHT = 13;
/**
 * The figure keeps a constant width so the caption text swapping on
 * hover/scroll simulation never resizes the surrounding layout.
 */
const MIN_FIGURE_WIDTH = 200;

interface DeviceWireframeProps {
  row: DeviceViewportRow;
  /** Test URL rendered live (scaled down) inside the viewport area; null shows the placeholder page. */
  previewUrl: string | null;
}

/**
 * To-scale schematic of the device screen: every bar that takes space (at its
 * real edge — Safari's tab bar sits at the bottom), the collapsible part of
 * mobile chrome, safe areas, and the viewport that is left — with the test URL
 * rendered live inside the remaining space. Hover or tap simulates scrolling
 * on dynamic-chrome devices.
 */
export function DeviceWireframe({ row, previewUrl }: DeviceWireframeProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { profile, result } = row;
  const { screen } = profile;

  const scale = Math.min(MAX_FRAME_HEIGHT / screen.height, MAX_FRAME_WIDTH / screen.width);
  const frameWidth = screen.width * scale;
  const frameHeight = screen.height * scale;

  const verticalBars = result.appliedConstraints.filter((bar) => bar.axis === 'vertical');
  const sideBars = result.appliedConstraints.filter((bar) => bar.axis === 'horizontal');
  const segments = verticalBars.flatMap(splitIntoEdgeSegments);
  const topSegments = segments.filter((segment) => segment.edge === 'top');
  const bottomSegments = segments
    .filter((segment) => segment.edge === 'bottom')
    .sort((left, right) => Number(left.isOsBar) - Number(right.isOsBar));
  const shownViewport = isScrolled ? result.maxViewport : result.viewport;

  // While the browser chrome is taller than the hardware inset, the home
  // indicator sits over the chrome — never over the page. Only the part that
  // outgrows the (collapsed) bottom chrome overlaps the viewport.
  const bottomChromeShown = bottomSegments.reduce(
    (total, segment) => total + (isScrolled ? segment.collapsedDip : segment.expandedDip),
    0,
  );
  const bottomChromeCollapsed = bottomSegments.reduce(
    (total, segment) => total + segment.collapsedDip,
    0,
  );
  const bottomInset = profile.safeAreaInsets?.bottom ?? 0;
  const bottomOverlap = Math.max(0, bottomInset - bottomChromeShown);
  const canOverlapBottom = bottomInset - bottomChromeCollapsed > 0;

  const legendItems = collectLegendItems(segments, sideBars, canOverlapBottom, result.scrollbar);

  const interactiveProps = row.hasDynamicChrome
    ? {
        onPointerEnter: (event: PointerEvent) => {
          if (event.pointerType === 'mouse') {
            setIsScrolled(true);
          }
        },
        onPointerLeave: (event: PointerEvent) => {
          if (event.pointerType === 'mouse') {
            setIsScrolled(false);
          }
        },
        onPointerUp: (event: PointerEvent) => {
          if (event.pointerType !== 'mouse') {
            setIsScrolled((value) => !value);
          }
        },
      }
    : {};

  return (
    <figure className="wireframe" style={{ width: Math.max(frameWidth, MIN_FIGURE_WIDTH) }}>
      <div
        aria-hidden="true"
        className="wireframe__screen"
        style={{ width: frameWidth, height: frameHeight }}
        {...interactiveProps}
      >
        {sideBars.map((bar) => (
          <div
            className="wireframe__bar wireframe__bar--side wireframe__bar--os"
            key={bar.id}
            style={{ width: bar.heightDip * scale }}
            title={`${CONSTRAINT_LABELS[bar.id]} — ${bar.heightDip} dip wide`}
          />
        ))}
        <div className="wireframe__column">
          {topSegments.map((segment) => (
            <WireframeSegment
              isScrolled={isScrolled}
              key={segment.key}
              scale={scale}
              segment={segment}
            />
          ))}
          <div className="wireframe__viewport">
            {/* Rendered at the real viewport size, scaled down — media queries
                match what the device would actually apply. */}
            <iframe
              className="wireframe__preview"
              height={shownViewport.height}
              style={{ transform: `scale(${scale})` }}
              tabIndex={-1}
              title={`Preview at ${shownViewport.width} × ${shownViewport.height}`}
              width={shownViewport.width}
              {...(previewUrl ? { src: previewUrl } : { srcDoc: PLACEHOLDER_PAGE_HTML })}
            />
            {result.scrollbar ? (
              <div
                className="wireframe__scrollbar"
                style={{ width: Math.max(result.scrollbar.heightDip * scale, 4) }}
                title={`Scrollbar — reserves ${result.scrollbar.heightDip} px of page width inside the viewport`}
              />
            ) : null}
            {bottomOverlap > 0 ? (
              <div
                className="wireframe__safe-area wireframe__safe-area--bottom"
                style={{ height: bottomOverlap * scale }}
                title={`Home indicator — overlaps the bottom ${bottomOverlap} dip of the page once the toolbar hides`}
              />
            ) : null}
          </div>
          {bottomSegments.map((segment) => (
            <WireframeSegment
              isScrolled={isScrolled}
              key={segment.key}
              scale={scale}
              segment={segment}
            />
          ))}
        </div>
      </div>
      {/* The size is already in the row header — repeat it only when it can
          change, i.e. while simulating scroll on dynamic-chrome devices. */}
      {row.hasDynamicChrome ? (
        <figcaption
          className="wireframe__caption"
          title="Hover or tap the device to simulate scrolling (svh → lvh)."
        >
          <strong className="wireframe__size">
            {shownViewport.width} × {shownViewport.height}
          </strong>
        </figcaption>
      ) : null}
      <ul className="wireframe__legend">
        {legendItems.map((item) => (
          <li className="wireframe__legend-item" key={item.id} title={item.description}>
            <span aria-hidden="true" className={`wireframe__legend-swatch ${item.swatchClass}`} />
            {item.label}
          </li>
        ))}
      </ul>
    </figure>
  );
}

interface LegendItem {
  id: string;
  label: string;
  description: string;
  swatchClass: string;
}

/** Only the colors actually visible in this wireframe make it into the legend. */
function collectLegendItems(
  segments: EdgeSegment[],
  sideBars: ResolvedConstraint[],
  canOverlapBottom: boolean,
  scrollbar: ResolvedConstraint | null,
): LegendItem[] {
  const items: LegendItem[] = [
    {
      id: 'viewport',
      label: 'Effective viewport',
      description: 'The space left for your content — the page preview renders here.',
      swatchClass: 'wireframe__legend-swatch--viewport',
    },
  ];

  const hasOsBar = segments.some((segment) => segment.isOsBar) || sideBars.length > 0;

  if (hasOsBar) {
    items.push({
      id: 'os',
      label: 'OS bar',
      description: 'Menu bar, Dock, or taskbar — owned by the operating system.',
      swatchClass: 'wireframe__bar--os',
    });
  }

  if (segments.some((segment) => !segment.isOsBar && segment.id !== 'bookmarksBar')) {
    items.push({
      id: 'browser',
      label: 'Browser UI',
      description: 'Address bar, tabs, and toolbars — always visible part.',
      swatchClass: 'wireframe__bar--browser',
    });
  }

  if (segments.some((segment) => segment.id === 'bookmarksBar')) {
    items.push({
      id: 'bookmarks',
      label: 'Bookmarks bar',
      description: 'Optional bar — toggle it in the filter above.',
      swatchClass: 'wireframe__bar--bookmarks',
    });
  }

  if (segments.some((segment) => segment.expandedDip !== segment.collapsedDip)) {
    items.push({
      id: 'collapsible',
      label: 'Hides on scroll',
      description: 'Part of the browser UI that collapses while scrolling (svh → lvh).',
      swatchClass: 'wireframe__bar--collapsible',
    });
  }

  if (scrollbar) {
    items.push({
      id: 'scrollbar',
      label: 'Scrollbar',
      description: `The layout loses ${scrollbar.heightDip} px of width, but media queries and vw keep reporting the full width — a 100vw element overflows.`,
      swatchClass: 'wireframe__legend-swatch--scrollbar',
    });
  }

  if (canOverlapBottom) {
    items.push({
      id: 'safe-area',
      label: 'Home indicator',
      description:
        'Once the toolbar hides while scrolling, it overlaps the page bottom — pad fixed UI with env(safe-area-inset-bottom).',
      swatchClass: 'wireframe__legend-swatch--safe-area',
    });
  }

  return items;
}

interface EdgeSegment {
  key: string;
  id: ConstraintId;
  edge: 'top' | 'bottom';
  expandedDip: number;
  collapsedDip: number;
  isOsBar: boolean;
  tooltip: string;
}

/**
 * A constraint can occupy both screen edges at once (Safari iOS: status area
 * on top, tab bar at the bottom). Split it into per-edge segments using the
 * bottomHeightDip portion of the measurement.
 */
function splitIntoEdgeSegments(bar: ResolvedConstraint): EdgeSegment[] {
  const isOsBar =
    bar.id === 'menuBar' || bar.id === 'dock' || bar.id === 'taskbar' || bar.id === 'shelf';

  if (bar.id === 'dock' || bar.id === 'taskbar' || bar.id === 'shelf') {
    return [createSegment(bar, 'bottom', bar.heightDip, bar.heightDip, isOsBar)];
  }

  const bottomExpanded = bar.bottomHeightDip ?? 0;
  const collapsedTotal = bar.collapsedHeightDip ?? bar.heightDip;
  const bottomCollapsed = bar.collapsedBottomHeightDip ?? bottomExpanded;
  const topExpanded = bar.heightDip - bottomExpanded;
  const topCollapsed = collapsedTotal - bottomCollapsed;

  const segments: EdgeSegment[] = [];

  if (topExpanded > 0) {
    segments.push(createSegment(bar, 'top', topExpanded, topCollapsed, isOsBar));
  }

  if (bottomExpanded > 0) {
    segments.push(createSegment(bar, 'bottom', bottomExpanded, bottomCollapsed, isOsBar));
  }

  return segments;
}

function createSegment(
  bar: ResolvedConstraint,
  edge: 'top' | 'bottom',
  expandedDip: number,
  collapsedDip: number,
  isOsBar: boolean,
): EdgeSegment {
  const collapseNote = expandedDip !== collapsedDip ? ` (${collapsedDip} while scrolling)` : '';

  return {
    key: `${bar.id}-${edge}`,
    id: bar.id,
    edge,
    expandedDip,
    collapsedDip,
    isOsBar,
    tooltip: `${CONSTRAINT_LABELS[bar.id]} (${edge}) — ${expandedDip} dip${collapseNote}`,
  };
}

interface WireframeSegmentProps {
  segment: EdgeSegment;
  scale: number;
  isScrolled: boolean;
}

function WireframeSegment({ segment, scale, isScrolled }: WireframeSegmentProps) {
  const shownDip = isScrolled ? segment.collapsedDip : segment.expandedDip;
  const solidHeight = segment.collapsedDip * scale;
  const collapsibleHeight = Math.max(0, shownDip - segment.collapsedDip) * scale;
  const isCollapsible = segment.expandedDip !== segment.collapsedDip;

  const solidStrip = (
    <div className={`wireframe__bar ${barVariantClass(segment)}`} style={{ height: solidHeight }}>
      {solidHeight >= MIN_LABEL_HEIGHT ? (
        <span className="wireframe__bar-label">{CONSTRAINT_LABELS[segment.id]}</span>
      ) : null}
    </div>
  );

  const collapsibleStrip = isCollapsible ? (
    <div
      className="wireframe__bar wireframe__bar--collapsible"
      style={{ height: collapsibleHeight }}
    >
      {collapsibleHeight >= MIN_LABEL_HEIGHT ? (
        <span className="wireframe__bar-label">hides on scroll</span>
      ) : null}
    </div>
  ) : null;

  // Keep the collapsible part adjacent to the viewport so collapsing grows it.
  return (
    <div className="wireframe__bar-group" title={segment.tooltip}>
      {segment.edge === 'top' ? solidStrip : collapsibleStrip}
      {segment.edge === 'top' ? collapsibleStrip : solidStrip}
    </div>
  );
}

function barVariantClass(segment: EdgeSegment): string {
  if (segment.id === 'bookmarksBar') {
    return 'wireframe__bar--bookmarks';
  }

  return segment.isOsBar ? 'wireframe__bar--os' : 'wireframe__bar--browser';
}
