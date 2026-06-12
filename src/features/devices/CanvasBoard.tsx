import {
  type CSSProperties,
  Fragment,
  memo,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BrandLockup } from '../../shared/ui/BrandLockup';
import {
  BROWSER_LABELS,
  BROWSER_OPTIONS,
  type KeyboardMode,
  type OsBarPosition,
  type ScrollbarMode,
} from '../profiles/constraintCatalog';
import type { BrowserName } from '../profiles/profile.types';
import { CANVAS_PARAM, type FormFactorFilter, TEST_URL_PARAM } from '../profiles/urlState';
import { type DeviceViewportRow, formatSize, type SimulationSettings } from './deviceViewports';
import { createPlaceholderPageHtml, normalizeTestUrl } from './testUrl';

/** Gap between frames in canvas coordinates (CSS px at 100 % zoom). */
const FRAME_GAP = 120;
/** Vertical gap between category bands — fits the divider and the band title at any zoom. */
const SECTION_GAP = 2400;
const MIN_SCALE = 0.02;
const MAX_SCALE = 2;
const FIT_PADDING = 80;
const ZOOM_STEP = 1.25;

interface CanvasBoardProps {
  rows: DeviceViewportRow[];
  testUrl: string;
  settings: SimulationSettings;
  deviceFilter: FormFactorFilter;
  /** Label of the single deep-linked device, when the board shows just one. */
  singleDeviceLabel?: string | null;
  onDeviceFilterChange: (filter: FormFactorFilter) => void;
  onSettingsChange: (settings: Partial<SimulationSettings>) => void;
  onTestUrlChange: (url: string) => void;
  onClose: () => void;
}

const DEVICE_FILTER_OPTIONS: { value: FormFactorFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'phone', label: 'Phones' },
  { value: 'tablet', label: 'Tablets' },
  { value: 'desktop', label: 'Desktops' },
];

interface FramePlacement {
  row: DeviceViewportRow;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CanvasSectionPlacement {
  id: string;
  label: string;
  /** Top of the band's frame area in canvas coordinates. */
  top: number;
}

const CANVAS_SECTIONS = [
  { id: 'mobile', label: 'Mobile' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'desktop', label: 'Desktop' },
  { id: 'edge', label: 'Edge cases' },
] as const;

function getSectionId(row: DeviceViewportRow): string {
  if (row.profile.kind === 'edgeCase') {
    return 'edge';
  }

  if (row.profile.formFactor === 'phone') {
    return 'mobile';
  }

  return row.profile.formFactor === 'tablet' ? 'tablet' : 'desktop';
}

interface BoardTransform {
  x: number;
  y: number;
  scale: number;
}

/**
 * Fullscreen, Figma-like board: every filtered device rendered as a real
 * iframe at its effective viewport size, smallest to largest, bottom-aligned.
 * Wheel zooms towards the cursor, dragging pans, and each frame keeps its
 * page scroll locked until explicitly unlocked.
 */
export function CanvasBoard({
  rows,
  testUrl,
  settings,
  deviceFilter,
  singleDeviceLabel,
  onDeviceFilterChange,
  onSettingsChange,
  onTestUrlChange,
  onClose,
}: CanvasBoardProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panState = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(null);
  const [transform, setTransform] = useState<BoardTransform>({ x: 0, y: 0, scale: 0.1 });
  const [isPanning, setIsPanning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Committed on Enter/blur only — typing must not reload every iframe.
  const [draftUrl, setDraftUrl] = useState(testUrl);

  const { placements, sections, contentWidth, contentHeight } = useMemo(
    () => createPlacements(rows),
    [rows],
  );
  const frameUrl = useMemo(() => normalizeTestUrl(testUrl), [testUrl]);

  const fitToView = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const { clientWidth, clientHeight } = canvas;
    const scale = clamp(
      Math.min(
        (clientWidth - FIT_PADDING * 2) / contentWidth,
        (clientHeight - FIT_PADDING * 2) / contentHeight,
      ),
      MIN_SCALE,
      1,
    );

    setTransform({
      scale,
      x: (clientWidth - contentWidth * scale) / 2,
      y: (clientHeight - contentHeight * scale) / 2,
    });
  }, [contentWidth, contentHeight]);

  useLayoutEffect(() => {
    fitToView();
  }, [fitToView]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Inside the Fullscreen API, Esc is reserved for leaving fullscreen.
      if (event.key === 'Escape' && !document.fullscreenElement) {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // React registers wheel listeners as passive; zooming needs preventDefault.
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = canvas.getBoundingClientRect();
      const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.008 : 0.0015));

      setTransform((current) =>
        zoomAround(current, event.clientX - bounds.left, event.clientY - bounds.top, factor),
      );
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const zoomBy = (factor: number) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    setTransform((current) =>
      zoomAround(current, canvas.clientWidth / 2, canvas.clientHeight / 2, factor),
    );
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const isInteractiveTarget = (event.target as HTMLElement).closest('button, a, input, iframe');

    if (event.button !== 0 || isInteractiveTarget) {
      return;
    }

    panState.current = { pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPanning(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pan = panState.current;

    if (!pan || pan.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - pan.lastX;
    const deltaY = event.clientY - pan.lastY;
    pan.lastX = event.clientX;
    pan.lastY = event.clientY;

    setTransform((current) => ({ ...current, x: current.x + deltaX, y: current.y + deltaY }));
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (panState.current?.pointerId === event.pointerId) {
      panState.current = null;
      setIsPanning(false);
    }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      overlayRef.current?.requestFullscreen();
    }
  };

  return (
    <div
      aria-label="Device canvas board"
      aria-modal="true"
      className="canvas-board"
      ref={overlayRef}
      role="dialog"
    >
      <header className="canvas-board__toolbar">
        <BrandLockup tagline="Check what really fits above the fold." />
        <div className="canvas-board__settings">
          {singleDeviceLabel ? null : (
            <label className="canvas-board__setting">
              <span>Devices</span>
              <select
                className="canvas-board__select"
                onChange={(event) => onDeviceFilterChange(event.target.value as FormFactorFilter)}
                value={deviceFilter}
              >
                {DEVICE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="canvas-board__setting">
            <span>Browser</span>
            <select
              className="canvas-board__select"
              onChange={(event) => onSettingsChange({ browser: event.target.value as BrowserName })}
              value={settings.browser}
            >
              {BROWSER_OPTIONS.map((browser) => (
                <option key={browser} value={browser}>
                  {BROWSER_LABELS[browser]}
                </option>
              ))}
            </select>
          </label>
          <label className="canvas-board__setting">
            <span>Bookmarks</span>
            <select
              className="canvas-board__select"
              onChange={(event) =>
                onSettingsChange({ showBookmarksBar: event.target.value === 'shown' })
              }
              value={settings.showBookmarksBar ? 'shown' : 'hidden'}
            >
              <option value="shown">Shown</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>
          <label className="canvas-board__setting">
            <span>Dock &amp; taskbar</span>
            <select
              className="canvas-board__select"
              onChange={(event) =>
                onSettingsChange({ osBarPosition: event.target.value as OsBarPosition })
              }
              value={settings.osBarPosition}
            >
              <option value="bottom">Bottom</option>
              <option value="side">Left / right</option>
            </select>
          </label>
          <label className="canvas-board__setting">
            <span>Scrollbar</span>
            <select
              className="canvas-board__select"
              onChange={(event) =>
                onSettingsChange({ scrollbarMode: event.target.value as ScrollbarMode })
              }
              value={settings.scrollbarMode}
            >
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </label>
          <label
            className="canvas-board__setting"
            title="Simulates a focused input with the native on-screen keyboard up — phones and tablets lose the keyboard height while typing."
          >
            <span>Keyboard</span>
            <select
              className="canvas-board__select"
              onChange={(event) =>
                onSettingsChange({ keyboardMode: event.target.value as KeyboardMode })
              }
              value={settings.keyboardMode}
            >
              <option value="closed">Closed</option>
              <option value="open">Open</option>
            </select>
          </label>
          <label className="canvas-board__setting">
            <span>Test URL</span>
            <input
              autoCapitalize="off"
              autoCorrect="off"
              className="canvas-board__url"
              inputMode="url"
              onBlur={() => onTestUrlChange(draftUrl)}
              onChange={(event) => setDraftUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onTestUrlChange(draftUrl);
                }
              }}
              placeholder="your-website.com"
              spellCheck={false}
              type="text"
              value={draftUrl}
            />
          </label>
        </div>
        <div className="canvas-board__controls">
          <button
            aria-label="Zoom out"
            className="canvas-board__control"
            onClick={() => zoomBy(1 / ZOOM_STEP)}
            type="button"
          >
            −
          </button>
          <span className="canvas-board__zoom">{Math.round(transform.scale * 100)} %</span>
          <button
            aria-label="Zoom in"
            className="canvas-board__control"
            onClick={() => zoomBy(ZOOM_STEP)}
            type="button"
          >
            +
          </button>
          <button className="canvas-board__control" onClick={fitToView} type="button">
            Fit
          </button>
          <button
            aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
            className="canvas-board__control canvas-board__control--icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
            type="button"
          >
            {isFullscreen ? (
              <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 16 16" width="15">
                <path
                  d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.6"
                />
              </svg>
            ) : (
              <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 16 16" width="15">
                <path
                  d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.6"
                />
              </svg>
            )}
          </button>
          <button
            aria-label="Close canvas"
            className="canvas-board__control canvas-board__control--icon"
            onClick={onClose}
            title="Close canvas (Esc)"
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
        </div>
      </header>
      <div
        className={
          isPanning ? 'canvas-board__canvas canvas-board__canvas--panning' : 'canvas-board__canvas'
        }
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        ref={canvasRef}
      >
        <div
          className="canvas-board__content"
          style={
            {
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              '--canvas-scale': String(transform.scale),
            } as CSSProperties
          }
        >
          {sections.map((section, index) => (
            <Fragment key={section.id}>
              {index > 0 ? (
                <div
                  aria-hidden="true"
                  className="canvas-section__divider"
                  style={{ top: section.top - SECTION_GAP / 2, width: contentWidth }}
                />
              ) : null}
              <h2 className="canvas-section__title" style={{ top: section.top - SECTION_GAP / 2 }}>
                {section.label}
              </h2>
            </Fragment>
          ))}
          <CanvasFrames placements={placements} testUrl={frameUrl} />
        </div>
      </div>
    </div>
  );
}

/**
 * Memoized so pan/zoom re-renders never touch the frames subtree — keeping
 * the iframe DOM nodes stable prevents the pages from reloading mid-drag.
 */
const CanvasFrames = memo(function CanvasFrames({
  placements,
  testUrl,
}: {
  placements: FramePlacement[];
  testUrl: string | null;
}) {
  return (
    <>
      {placements.map((placement) => (
        <CanvasDeviceFrame key={placement.row.profile.id} placement={placement} testUrl={testUrl} />
      ))}
    </>
  );
});

/** How long the share button shows its "copied" confirmation. */
const SHARE_FEEDBACK_MS = 1600;

function CanvasDeviceFrame({
  placement,
  testUrl,
}: {
  placement: FramePlacement;
  testUrl: string | null;
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const { row, x, y, width, height } = placement;
  const sizeLabel = formatSize(row.result.viewport);
  const simulatedScrollbar = !isUnlocked ? row.result.scrollbar : null;

  // Same deep link as the ↗ button on the homepage — the URL opens the
  // canvas with just this device, so a shared link leads straight back here.
  // The test URL is set explicitly: the address bar updates debounced, so it
  // may lag behind what the frames are actually showing.
  const createShareUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set(CANVAS_PARAM, row.profile.id);

    if (testUrl) {
      url.searchParams.set(TEST_URL_PARAM, testUrl);
    } else {
      url.searchParams.delete(TEST_URL_PARAM);
    }

    return url.toString();
  };

  const copyShareLink = () => {
    navigator.clipboard
      .writeText(createShareUrl())
      .then(() => {
        setIsLinkCopied(true);
        window.setTimeout(() => setIsLinkCopied(false), SHARE_FEEDBACK_MS);
      })
      // Clipboard access can be denied (unfocused document, permissions) —
      // without the confirmation the user simply retries.
      .catch(() => {});
  };

  return (
    <div className="canvas-frame" style={{ left: x, top: y, width, height }}>
      <div className="canvas-frame__meta">
        <strong className="canvas-frame__name">{row.profile.label}</strong>
        <span
          className="canvas-frame__size"
          title={
            row.result.scrollbar
              ? `Classic scrollbar on: the layout narrows to ${row.result.contentWidth} px, but media queries and vw still see ${row.result.viewport.width} px.`
              : undefined
          }
        >
          {BROWSER_LABELS[row.browser]} · {sizeLabel}
        </span>
      </div>
      {/* The iframe always keeps the full viewport width — a classic scrollbar
          never changes media queries or vw, it only narrows the page layout.
          The simulated bar therefore overlays the right edge. */}
      <iframe
        className="canvas-frame__iframe"
        height={height}
        title={`${row.profile.label} — ${sizeLabel}`}
        width={width}
        {...(testUrl
          ? { src: testUrl }
          : {
              srcDoc: createPlaceholderPageHtml({
                deviceLabel: row.profile.label,
                browserLabel: BROWSER_LABELS[row.browser],
              }),
            })}
      />
      {/* While locked the page cannot scroll, so no real scrollbar exists —
          draw the simulated one instead. Unlocking hands the edge back to
          the browser's own scrollbar. */}
      {simulatedScrollbar ? (
        <div
          aria-hidden="true"
          className="canvas-frame__scrollbar"
          style={{ width: simulatedScrollbar.heightDip }}
        />
      ) : null}
      {!isUnlocked ? (
        <div
          className="canvas-frame__shield"
          title="Scroll locked — unlock to interact with the page."
        />
      ) : null}
      <button
        aria-label={isUnlocked ? 'Lock scroll' : 'Unlock scroll'}
        aria-pressed={isUnlocked}
        className={
          isUnlocked ? 'canvas-frame__lock canvas-frame__lock--unlocked' : 'canvas-frame__lock'
        }
        onClick={() => setIsUnlocked((value) => !value)}
        title={isUnlocked ? 'Lock scroll' : 'Unlock scroll'}
        type="button"
      >
        {isUnlocked ? (
          <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 16 16" width="14">
            <rect
              height="7"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.5"
              width="9"
              x="3.5"
              y="7"
            />
            <path
              d="M5.5 7V5a2.5 2.5 0 0 1 4.9-.7"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svg>
        ) : (
          <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 16 16" width="14">
            <rect
              height="7"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.5"
              width="9"
              x="3.5"
              y="7"
            />
            <path
              d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svg>
        )}
      </button>
      <button
        aria-label={`Copy a shareable link to ${row.profile.label}`}
        className={
          isLinkCopied ? 'canvas-frame__share canvas-frame__share--copied' : 'canvas-frame__share'
        }
        onClick={copyShareLink}
        title={
          isLinkCopied
            ? 'Link copied'
            : `Copy a shareable link — opens just ${row.profile.label} at ${sizeLabel}.`
        }
        type="button"
      >
        {isLinkCopied ? (
          <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 16 16" width="14">
            <path
              d="M3.5 8.5l3 3 6-6.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        ) : (
          <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 16 16" width="14">
            <path d="M6.5 9.5l3-3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
            <path
              d="M7.25 4.75l.9-.9a2.65 2.65 0 0 1 3.75 3.75l-.9.9"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
            <path
              d="M8.75 11.25l-.9.9A2.65 2.65 0 0 1 4.1 8.4l.9-.9"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svg>
        )}
      </button>
      <a
        className="canvas-frame__open"
        href={createShareUrl()}
        rel="noreferrer"
        target="_blank"
        title={`Open just ${row.profile.label} at ${sizeLabel} in a new window.`}
      >
        <span className="visually-hidden">Open {row.profile.label} in a new window</span>
        <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 16 16" width="14">
          <path
            d="M6.5 4.5H4.75A1.25 1.25 0 0 0 3.5 5.75v5.5a1.25 1.25 0 0 0 1.25 1.25h5.5a1.25 1.25 0 0 0 1.25-1.25V9.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
          <path
            d="M9.5 3.5H12.5V6.5M12 4l-4.5 4.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </a>
    </div>
  );
}

/**
 * One band per category (mobile / tablet / desktop / edge cases). Within a
 * band, frames are sorted by viewport width and bottom-aligned.
 */
function createPlacements(rows: DeviceViewportRow[]): {
  placements: FramePlacement[];
  sections: CanvasSectionPlacement[];
  contentWidth: number;
  contentHeight: number;
} {
  const placements: FramePlacement[] = [];
  const sections: CanvasSectionPlacement[] = [];
  let nextY = 0;
  let contentWidth = 1;

  for (const section of CANVAS_SECTIONS) {
    const sectionRows = rows
      .filter((row) => getSectionId(row) === section.id)
      .sort(
        (left, right) =>
          left.result.viewport.width - right.result.viewport.width ||
          left.result.viewport.height - right.result.viewport.height,
      );

    if (sectionRows.length === 0) {
      continue;
    }

    const bandHeight = Math.max(...sectionRows.map((row) => row.result.viewport.height));
    let nextX = 0;

    for (const row of sectionRows) {
      const { width, height } = row.result.viewport;
      placements.push({ row, x: nextX, y: nextY + bandHeight - height, width, height });
      nextX += width + FRAME_GAP;
    }

    sections.push({ id: section.id, label: section.label, top: nextY });
    contentWidth = Math.max(contentWidth, nextX - FRAME_GAP);
    nextY += bandHeight + SECTION_GAP;
  }

  return { placements, sections, contentWidth, contentHeight: Math.max(nextY - SECTION_GAP, 1) };
}

function zoomAround(
  current: BoardTransform,
  originX: number,
  originY: number,
  factor: number,
): BoardTransform {
  const scale = clamp(current.scale * factor, MIN_SCALE, MAX_SCALE);
  const ratio = scale / current.scale;

  return {
    scale,
    x: originX - (originX - current.x) * ratio,
    y: originY - (originY - current.y) * ratio,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
