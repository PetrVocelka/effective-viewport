import type { ReactNode } from 'react';

interface ToolComparisonRow {
  tool: string;
  greatAt: string;
  fit: ReactNode;
}

const COMPARISON_ROWS: ToolComparisonRow[] = [
  {
    tool: 'Chrome DevTools',
    greatAt: 'Deep-diving a single page — inspect, throttle, emulate one viewport at a time.',
    fit: (
      <>
        We feed it. The built-in presets are full screen sizes that ignore browser UI and OS bars —
        so every device detail here hands you a copy-ready custom preset instead. One click on the
        name copies it, and the name spells out exactly what's subtracted — e.g.{' '}
        <code>[EFV] MacBook Pro 16" (Menu bar + Side dock + Browser UI + Bookmarks)</code> — so the
        presets group together in your device list and you cherry-pick only the devices your
        analytics says matter. And the canvas shows all of them at once, which DevTools cannot.
      </>
    ),
  },
  {
    tool: 'Real devices & simulators',
    greatAt:
      'Final verification on real devices and simulators — rendering quirks, touch, performance.',
    fit: 'The next step, not a competitor. Run the audit here in seconds, share the problematic resolution with the team as a link, then confirm the fix on a real device or a device cloud.',
  },
  {
    tool: 'Playwright / Cypress screenshots',
    greatAt: 'Automated visual regression on every commit.',
    fit: 'Use us as the data source: the device dataset ships as a JSON package, so your pipeline can screenshot real effective viewports and assert that the important elements stay in view.',
  },
];

/**
 * Positioning section: Effective Viewport is the fast audit step before the
 * tools people already use — not a replacement for any of them.
 */
export function ToolComparison() {
  return (
    <section aria-labelledby="tool-comparison-title" className="tool-compare chapter">
      <header className="section-intro">
        <h2 id="tool-comparison-title">The step before the tools you already use</h2>
        <p>
          Effective Viewport is the brutally fast audit: check the worst cases in seconds, share a
          broken viewport as a link. Everything after that belongs to the tools you already use.
        </p>
      </header>
      <ul className="tool-compare__list">
        {COMPARISON_ROWS.map((row) => (
          <li className="tool-compare__row" key={row.tool}>
            <div className="tool-compare__tool">
              <h3>{row.tool}</h3>
              <span className="tool-compare__micro-label">great at</span>
              <p>{row.greatAt}</p>
            </div>
            <div className="tool-compare__fit">
              <span className="tool-compare__micro-label">with Effective Viewport</span>
              <p>{row.fit}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
