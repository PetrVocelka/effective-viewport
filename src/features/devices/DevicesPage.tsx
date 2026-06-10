import { useEffect, useMemo, useState } from 'react';
import constraintsJson from '../../data/constraints.json';
import devicesJson from '../../data/devices.json';
import {
  BROWSER_LABELS,
  BROWSER_OPTIONS,
  isBrowserAvailable,
  type OsBarPosition,
  type ScrollbarMode,
} from '../profiles/constraintCatalog';
import type {
  BrowserName,
  ConstraintDataset,
  DeviceDataset,
  DeviceProfile,
} from '../profiles/profile.types';
import {
  CANVAS_PARAM,
  type FormFactorFilter,
  readUrlState,
  writeUrlState,
} from '../profiles/urlState';
import { CanvasBoard } from './CanvasBoard';
import { DeviceRow } from './DeviceRow';
import {
  createDeviceViewportRow,
  type SimulationSettings,
  sortByEffectiveHeight,
} from './deviceViewports';
import { SafeViewportSummary } from './SafeViewportSummary';
import { createSafeViewportSummary } from './safeSummary';
import { SegmentedControl } from './SegmentedControl';

const devices = devicesJson as DeviceDataset;
const constraints = constraintsJson as ConstraintDataset;
const allProfiles = [...devices.curated, ...devices.measured];

interface DeviceGroup {
  id: string;
  label: string;
  matches: (profile: DeviceProfile) => boolean;
}

const OS_BAR_POSITIONS: { id: OsBarPosition; label: string }[] = [
  { id: 'bottom', label: 'Bottom' },
  { id: 'side', label: 'Left / right' },
];

const FORM_FACTOR_FILTERS: { id: FormFactorFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'phone', label: 'Phones' },
  { id: 'tablet', label: 'Tablets' },
  { id: 'desktop', label: 'Desktops' },
];

const BOOKMARKS_OPTIONS: { id: 'shown' | 'hidden'; label: string }[] = [
  { id: 'shown', label: 'Shown' },
  { id: 'hidden', label: 'Hidden' },
];

const SCROLLBAR_OPTIONS: { id: ScrollbarMode; label: string }[] = [
  { id: 'on', label: 'On' },
  { id: 'off', label: 'Off' },
];

/** Opens the single-device canvas in a new tab — the URL is shareable as is. */
function openCanvasDeepLink(deviceId: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(CANVAS_PARAM, deviceId);
  window.open(url.toString(), '_blank', 'noopener');
}

const DEVICE_GROUPS: DeviceGroup[] = [
  {
    id: 'phones',
    label: 'Phones',
    matches: (profile) => profile.formFactor === 'phone' && profile.kind !== 'edgeCase',
  },
  {
    id: 'tablets',
    label: 'Tablets',
    matches: (profile) => profile.formFactor === 'tablet' && profile.kind !== 'edgeCase',
  },
  {
    id: 'desktops',
    label: 'Laptops & desktops',
    matches: (profile) => profile.formFactor === 'desktop' && profile.kind !== 'edgeCase',
  },
  {
    id: 'edge-cases',
    label: 'Edge cases',
    matches: (profile) => profile.kind === 'edgeCase',
  },
];

export function DevicesPage() {
  const initialUrlState = useMemo(() => readUrlState(), []);
  const [selectedBrowser, setSelectedBrowser] = useState<BrowserName>(
    initialUrlState.browser ?? 'chrome',
  );
  const [showBookmarksBar, setShowBookmarksBar] = useState(initialUrlState.showBookmarksBar);
  const [osBarPosition, setOsBarPosition] = useState<OsBarPosition>(initialUrlState.osBarPosition);
  const [scrollbarMode, setScrollbarMode] = useState<ScrollbarMode>(initialUrlState.scrollbarMode);
  const [formFactorFilter, setFormFactorFilter] = useState<FormFactorFilter>(
    initialUrlState.formFactorFilter,
  );
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(initialUrlState.deviceId);
  const [testUrl, setTestUrl] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // When set, the canvas shows just this device — deep-linkable via ?canvas=<id>.
  const [canvasDeviceId, setCanvasDeviceId] = useState<string | null>(
    initialUrlState.canvasDeviceId,
  );
  const [isBoardOpen, setIsBoardOpen] = useState(Boolean(initialUrlState.canvasDeviceId));

  useEffect(() => {
    writeUrlState({
      browser: selectedBrowser,
      showBookmarksBar,
      osBarPosition,
      scrollbarMode,
      formFactorFilter,
      deviceId: expandedDeviceId,
      canvasDeviceId: isBoardOpen ? canvasDeviceId : null,
    });
  }, [
    selectedBrowser,
    showBookmarksBar,
    osBarPosition,
    scrollbarMode,
    formFactorFilter,
    expandedDeviceId,
    canvasDeviceId,
    isBoardOpen,
  ]);

  const allRows = useMemo(
    () =>
      allProfiles
        .filter((profile) => isBrowserAvailable(profile.os.name, selectedBrowser))
        .map((profile) =>
          createDeviceViewportRow(profile, constraints, {
            browser: selectedBrowser,
            showBookmarksBar,
            osBarPosition,
            scrollbarMode,
          }),
        ),
    [selectedBrowser, showBookmarksBar, osBarPosition, scrollbarMode],
  );

  // Edge cases (foldables, ultra-wide) count too — the safe sizes must hold
  // for every listed device, and the folded Z Fold drives the mobile width.
  const safeSummary = useMemo(
    () =>
      createSafeViewportSummary(
        allRows.filter(
          (row) => formFactorFilter === 'all' || row.profile.formFactor === formFactorFilter,
        ),
      ),
    [allRows, formFactorFilter],
  );

  const boardRows = useMemo(() => {
    if (canvasDeviceId) {
      return allRows.filter((row) => row.profile.id === canvasDeviceId);
    }

    return allRows.filter(
      (row) => formFactorFilter === 'all' || row.profile.formFactor === formFactorFilter,
    );
  }, [allRows, canvasDeviceId, formFactorFilter]);

  const handleSettingsChange = (settings: Partial<SimulationSettings>) => {
    if (settings.browser !== undefined) {
      setSelectedBrowser(settings.browser);
    }

    if (settings.showBookmarksBar !== undefined) {
      setShowBookmarksBar(settings.showBookmarksBar);
    }

    if (settings.osBarPosition !== undefined) {
      setOsBarPosition(settings.osBarPosition);
    }

    if (settings.scrollbarMode !== undefined) {
      setScrollbarMode(settings.scrollbarMode);
    }
  };

  const groups = useMemo(
    () =>
      DEVICE_GROUPS.map((group) => ({
        ...group,
        rows: sortByEffectiveHeight(
          allRows.filter(
            (row) =>
              group.matches(row.profile) &&
              (formFactorFilter === 'all' || row.profile.formFactor === formFactorFilter),
          ),
        ),
      })).filter((group) => group.rows.length > 0),
    [allRows, formFactorFilter],
  );

  return (
    <>
      <section aria-label="Simulation settings" className="filter-bar">
        <button
          aria-expanded={isFilterOpen}
          className="filter-bar__toggle"
          onClick={() => setIsFilterOpen((value) => !value)}
          type="button"
        >
          Filters
          <svg
            aria-hidden="true"
            className={
              isFilterOpen ? 'filter-bar__chevron filter-bar__chevron--open' : 'filter-bar__chevron'
            }
            fill="none"
            height="14"
            viewBox="0 0 16 16"
            width="14"
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </button>
        <div
          className={
            isFilterOpen ? 'filter-bar__items filter-bar__items--open' : 'filter-bar__items'
          }
        >
          <label
            className="filter-bar__item"
            title="Only devices where the browser exists are listed — Safari hides Android and Windows hardware."
          >
            <span>Browser</span>
            <select
              className="filter-bar__select"
              onChange={(event) => setSelectedBrowser(event.target.value as BrowserName)}
              value={selectedBrowser}
            >
              {BROWSER_OPTIONS.map((browser) => (
                <option key={browser} value={browser}>
                  {BROWSER_LABELS[browser]}
                </option>
              ))}
            </select>
          </label>
          <div
            className="filter-bar__item"
            title="Most desktop users keep the bookmarks bar visible; it costs ~28 dip of height."
          >
            <span>Bookmarks</span>
            <SegmentedControl
              label="Bookmarks bar"
              onChange={(option) => setShowBookmarksBar(option === 'shown')}
              options={BOOKMARKS_OPTIONS}
              value={showBookmarksBar ? 'shown' : 'hidden'}
            />
          </div>
          <div
            className="filter-bar__item"
            title="Side bars cost width instead of height. Affects the macOS Dock and the Windows 10 taskbar; Windows 11 no longer supports side placement."
          >
            <span>Dock & taskbar</span>
            <SegmentedControl
              label="Dock and taskbar position"
              onChange={setOsBarPosition}
              options={OS_BAR_POSITIONS}
              value={osBarPosition}
            />
          </div>
          <div
            className="filter-bar__item"
            title="A desktop scrollbar reserves ~15 px of layout width inside the viewport (Windows/Linux always, macOS with a mouse). Media queries still see the full width. Turn off to simulate overlay scrollbars or a page that does not scroll."
          >
            <span>Scrollbar</span>
            <SegmentedControl
              label="Scrollbar style"
              onChange={setScrollbarMode}
              options={SCROLLBAR_OPTIONS}
              value={scrollbarMode}
            />
          </div>
          <div className="filter-bar__item" title="Changes what is listed, not the numbers.">
            <span>Devices</span>
            <SegmentedControl
              label="Device type filter"
              onChange={setFormFactorFilter}
              options={FORM_FACTOR_FILTERS}
              value={formFactorFilter}
            />
          </div>
          <label className="filter-bar__item filter-bar__item--grow">
            <span>Test URL</span>
            <input
              className="filter-bar__url"
              onChange={(event) => setTestUrl(event.target.value)}
              placeholder="https://example.com"
              type="url"
              value={testUrl}
            />
          </label>
        </div>
      </section>

      {!isBoardOpen ? (
        <button
          className="canvas-fab"
          onClick={() => {
            setCanvasDeviceId(null);
            setIsBoardOpen(true);
          }}
          title="Open every filtered device side by side on a zoomable canvas."
          type="button"
        >
          <span aria-hidden="true">▦</span> Canvas view
        </button>
      ) : null}

      {isBoardOpen ? (
        <CanvasBoard
          deviceFilter={formFactorFilter}
          onClose={() => {
            setIsBoardOpen(false);
            setCanvasDeviceId(null);
          }}
          onDeviceFilterChange={(filter) => {
            setCanvasDeviceId(null);
            setFormFactorFilter(filter);
          }}
          onSettingsChange={handleSettingsChange}
          onTestUrlChange={setTestUrl}
          rows={boardRows}
          settings={{ browser: selectedBrowser, showBookmarksBar, osBarPosition, scrollbarMode }}
          singleDeviceLabel={canvasDeviceId ? (boardRows[0]?.profile.label ?? null) : null}
          testUrl={testUrl}
        />
      ) : null}

      <SafeViewportSummary entries={safeSummary} />

      {groups.map((group) => (
        <section aria-labelledby={`group-${group.id}`} className="device-group" key={group.id}>
          <h2 className="device-group__title" id={`group-${group.id}`}>
            {group.label}
            <span className="device-group__count">{group.rows.length}</span>
          </h2>
          <ul className="device-list">
            {group.rows.map((row) => (
              <DeviceRow
                isExpanded={expandedDeviceId === row.profile.id}
                key={row.profile.id}
                onOpenCanvas={() => openCanvasDeepLink(row.profile.id)}
                onToggle={() =>
                  setExpandedDeviceId((currentId) =>
                    currentId === row.profile.id ? null : row.profile.id,
                  )
                }
                row={row}
                testUrl={testUrl}
              />
            ))}
          </ul>
        </section>
      ))}

      <p className="dataset-note">
        Heights assume default OS settings (visible Dock/taskbar, default sizes) and a maximized
        browser window. Treat them as the defensive minimum, not an exact emulation. Values marked
        “estimate” come from the constraint dataset and have not been confirmed on hardware yet —
        you can help on the Measure page.
      </p>
    </>
  );
}
