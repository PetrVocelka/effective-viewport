import { useEffect, useMemo, useState } from 'react';
import constraintsJson from '../../data/constraints.json';
import devicesJson from '../../data/devices.json';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';
import { BrandMark } from '../../shared/ui/BrandMark';
import { ClearUrlButton } from '../../shared/ui/ClearUrlButton';
import {
  BROWSER_LABELS,
  BROWSER_OPTIONS,
  isBrowserAvailable,
  type KeyboardMode,
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
  CANVAS_ALL,
  CANVAS_PARAM,
  type FormFactorFilter,
  readUrlState,
  TEST_URL_PARAM,
  writeUrlState,
} from '../profiles/urlState';
import { AccessibilityNote } from './AccessibilityNote';
import { CanvasBoard } from './CanvasBoard';
import { DeviceRow } from './DeviceRow';
import {
  createDeviceViewportRow,
  type SimulationSettings,
  sortByEffectiveHeight,
} from './deviceViewports';
import { Faq } from './Faq';
import { FoldDemo } from './FoldDemo';
import { SafeViewportSummary } from './SafeViewportSummary';
import { SegmentedControl } from './SegmentedControl';
import { createSafeViewportSummary } from './safeSummary';
import { ToolComparison } from './ToolComparison';

const devices = devicesJson as DeviceDataset;
const constraints = constraintsJson as ConstraintDataset;
const allProfiles = [...devices.curated, ...devices.measured];

// The "Reality-check" summary is a set of design constants: worst cases across
// every tracked device × browser at default settings. Filters and the browser
// switch never change these numbers — designers can rely on them.
const SAFE_SUMMARY = createSafeViewportSummary(
  BROWSER_OPTIONS.flatMap((browser) =>
    allProfiles
      .filter((profile) => isBrowserAvailable(profile.os.name, browser))
      .map((profile) =>
        createDeviceViewportRow(profile, constraints, {
          browser,
          showBookmarksBar: true,
          osBarPosition: 'bottom',
          scrollbarMode: 'on',
          keyboardMode: 'closed',
        }),
      ),
  ),
);

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

const KEYBOARD_OPTIONS: { id: KeyboardMode; label: string }[] = [
  { id: 'closed', label: 'Closed' },
  { id: 'open', label: 'Open' },
];

/** Opens the single-device canvas in a new tab — the URL is shareable as is. */
function openCanvasDeepLink(deviceId: string, testUrl: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(CANVAS_PARAM, deviceId);

  // Set explicitly — the address bar updates debounced and could lag behind.
  if (testUrl.trim()) {
    url.searchParams.set(TEST_URL_PARAM, testUrl);
  } else {
    url.searchParams.delete(TEST_URL_PARAM);
  }

  window.open(url.toString(), '_blank', 'noopener');
}

/** The device-list group that the form-factor filter maps onto. */
const GROUP_ID_BY_FORM_FACTOR: Record<Exclude<FormFactorFilter, 'all'>, string> = {
  phone: 'phones',
  tablet: 'tablets',
  desktop: 'desktops',
};

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
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>(initialUrlState.keyboardMode);
  const [formFactorFilter, setFormFactorFilter] = useState<FormFactorFilter>(
    initialUrlState.formFactorFilter,
  );
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(initialUrlState.deviceId);
  // The reference list is long — phones stay expanded, the rest collapses
  // into accordions. A deep-linked device must start with its group open.
  const [openGroupIds, setOpenGroupIds] = useState<ReadonlySet<string>>(() => {
    const open = new Set(['phones']);
    const linkedProfile = initialUrlState.deviceId
      ? allProfiles.find((profile) => profile.id === initialUrlState.deviceId)
      : undefined;
    const linkedGroup = linkedProfile
      ? DEVICE_GROUPS.find((group) => group.matches(linkedProfile))
      : undefined;

    if (linkedGroup) {
      open.add(linkedGroup.id);
    }

    return open;
  });
  const [testUrl, setTestUrl] = useState(initialUrlState.testUrl);
  // Typing must not reload every live iframe on each keystroke.
  const debouncedTestUrl = useDebouncedValue(testUrl, 600);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // When set, the canvas shows just this device — deep-linkable via ?canvas=<id>.
  // `?canvas=all` opens the full board: the canvas has its own address.
  const [canvasDeviceId, setCanvasDeviceId] = useState<string | null>(
    initialUrlState.canvasDeviceId === CANVAS_ALL ? null : initialUrlState.canvasDeviceId,
  );
  const [isBoardOpen, setIsBoardOpen] = useState(Boolean(initialUrlState.canvasDeviceId));
  // The canvas has its own device filter — the list filter below must never
  // leak into the hero entry point. A deep link still restores it from ?type.
  const [canvasFilter, setCanvasFilter] = useState<FormFactorFilter>(
    initialUrlState.canvasDeviceId ? initialUrlState.formFactorFilter : 'all',
  );

  useEffect(() => {
    writeUrlState({
      browser: selectedBrowser,
      showBookmarksBar,
      osBarPosition,
      scrollbarMode,
      keyboardMode,
      // While the board is open, ?type describes the canvas so its deep link
      // round-trips; otherwise it describes the reference list below.
      formFactorFilter: isBoardOpen ? canvasFilter : formFactorFilter,
      // The debounced value keeps history writes off the typing hot path.
      testUrl: debouncedTestUrl,
      deviceId: expandedDeviceId,
      canvasDeviceId: isBoardOpen ? (canvasDeviceId ?? CANVAS_ALL) : null,
    });
  }, [
    selectedBrowser,
    showBookmarksBar,
    osBarPosition,
    scrollbarMode,
    keyboardMode,
    formFactorFilter,
    canvasFilter,
    debouncedTestUrl,
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
            keyboardMode,
          }),
        ),
    [selectedBrowser, showBookmarksBar, osBarPosition, scrollbarMode, keyboardMode],
  );

  const boardRows = useMemo(() => {
    if (canvasDeviceId) {
      return allRows.filter((row) => row.profile.id === canvasDeviceId);
    }

    return allRows.filter(
      (row) => canvasFilter === 'all' || row.profile.formFactor === canvasFilter,
    );
  }, [allRows, canvasDeviceId, canvasFilter]);

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

    if (settings.keyboardMode !== undefined) {
      setKeyboardMode(settings.keyboardMode);
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

  // The hero entry point always shows everything — the list filter below
  // must never narrow what "Find out" opens.
  const openCompareAll = () => {
    setCanvasFilter('all');
    setCanvasDeviceId(null);
    setIsBoardOpen(true);
  };

  const openCategoryInCanvas = (formFactor: FormFactorFilter) => {
    setCanvasFilter(formFactor);
    setCanvasDeviceId(null);
    setIsBoardOpen(true);
  };

  // Filtering down to one device type means the user wants to see it —
  // open its group so the filter never lands on a collapsed accordion.
  useEffect(() => {
    if (formFactorFilter === 'all') {
      return;
    }

    const groupId = GROUP_ID_BY_FORM_FACTOR[formFactorFilter];
    setOpenGroupIds((current) => (current.has(groupId) ? current : new Set([...current, groupId])));
  }, [formFactorFilter]);

  const handleGroupToggle = (groupId: string, isOpen: boolean) => {
    setOpenGroupIds((current) => {
      if (current.has(groupId) === isOpen) {
        return current;
      }

      const next = new Set(current);

      if (isOpen) {
        next.add(groupId);
      } else {
        next.delete(groupId);
      }

      return next;
    });
  };

  return (
    <>
      <header className="app-header">
        <h1>
          <a href={import.meta.env.BASE_URL}>
            <BrandMark className="app-header__mark" /> Effective Viewport
          </a>
        </h1>
      </header>

      <SafeViewportSummary
        entries={SAFE_SUMMARY}
        onCompareAll={openCompareAll}
        onOpenCategory={openCategoryInCanvas}
        onTestUrlChange={setTestUrl}
        previewTestUrl={debouncedTestUrl}
        testUrl={testUrl}
      />

      <header className="section-intro chapter">
        <h2>Device reference</h2>
        <p className="section-intro__one-liner">
          Every tracked device and what is really left of its viewport — expand any row for the full
          breakdown and DevTools presets.
        </p>
      </header>

      <section aria-label="Simulation settings" className="filter-bar">
        <button
          aria-expanded={isFilterOpen}
          className="filter-bar__toggle"
          onClick={() => setIsFilterOpen((value) => !value)}
          type="button"
        >
          Settings
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
          <div
            className="filter-bar__item"
            title="Simulates a focused input with the native on-screen keyboard up — phones and tablets lose ~280–320 dip of height while typing. Desktops are unaffected."
          >
            <span>Keyboard</span>
            <SegmentedControl
              label="On-screen keyboard"
              onChange={setKeyboardMode}
              options={KEYBOARD_OPTIONS}
              value={keyboardMode}
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
          <label
            className="filter-bar__item filter-bar__item--url"
            title="Loads this page inside every device preview — same URL as the input at the top."
          >
            <span>Test URL</span>
            <div className="url-field">
              <input
                autoCapitalize="off"
                autoCorrect="off"
                className="filter-bar__url"
                inputMode="url"
                onChange={(event) => setTestUrl(event.target.value)}
                placeholder="your-website.com"
                spellCheck={false}
                type="text"
                value={testUrl}
              />
              {testUrl ? <ClearUrlButton onClear={() => setTestUrl('')} /> : null}
            </div>
          </label>
        </div>
      </section>

      {isBoardOpen ? (
        <CanvasBoard
          deviceFilter={canvasFilter}
          onClose={() => {
            setIsBoardOpen(false);
            setCanvasDeviceId(null);
          }}
          onDeviceFilterChange={(filter) => {
            setCanvasDeviceId(null);
            setCanvasFilter(filter);
          }}
          onSettingsChange={handleSettingsChange}
          onTestUrlChange={setTestUrl}
          rows={boardRows}
          settings={{
            browser: selectedBrowser,
            showBookmarksBar,
            osBarPosition,
            scrollbarMode,
            keyboardMode,
          }}
          singleDeviceLabel={canvasDeviceId ? (boardRows[0]?.profile.label ?? null) : null}
          testUrl={debouncedTestUrl}
        />
      ) : null}

      {groups.map((group) => (
        <details
          className="device-group"
          key={group.id}
          onToggle={(event) => handleGroupToggle(group.id, event.currentTarget.open)}
          open={openGroupIds.has(group.id)}
        >
          <summary className="device-group__summary">
            <h2 className="device-group__title" id={`group-${group.id}`}>
              {group.label}
              <span className="device-group__count">{group.rows.length}</span>
            </h2>
            <svg
              aria-hidden="true"
              className="device-group__chevron"
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
          </summary>
          <ul className="device-list">
            {group.rows.map((row) => (
              <DeviceRow
                isExpanded={expandedDeviceId === row.profile.id}
                key={row.profile.id}
                onOpenCanvas={() => openCanvasDeepLink(row.profile.id, testUrl)}
                onToggle={() =>
                  setExpandedDeviceId((currentId) =>
                    currentId === row.profile.id ? null : row.profile.id,
                  )
                }
                row={row}
                testUrl={debouncedTestUrl}
              />
            ))}
          </ul>
        </details>
      ))}

      <p className="dataset-note">
        Heights assume default OS settings (visible Dock/taskbar, default sizes) and a maximized
        browser window. Treat them as the defensive minimum, not an exact emulation. Values marked
        “estimate” come from the constraint dataset and have not been confirmed on a real device or
        a real-device simulator yet — you can help on the Measure page.
      </p>

      <FoldDemo />

      <AccessibilityNote />

      <ToolComparison />

      <Faq />
    </>
  );
}
