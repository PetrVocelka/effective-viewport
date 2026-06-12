/**
 * Normalizes the user-typed test URL: trims it, prepends https:// when the
 * scheme is missing, and returns null when the field is empty — callers then
 * fall back to the built-in placeholder page instead of a broken iframe.
 *
 * Sloppy or duplicated schemes ("https//", "https:", "https://https://…")
 * are collapsed into a single clean one; explicit http:// is preserved.
 */
export function normalizeTestUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return null;
  }

  const scheme = /^http[:/]/i.test(trimmed) && !/^https/i.test(trimmed) ? 'http' : 'https';
  const rest = trimmed.replace(/^(?:https?[:/]+)+/i, '');

  if (!rest) {
    return null;
  }

  return `${scheme}://${rest}`;
}

export interface PlaceholderPageContext {
  /** Device label shown under the live size, e.g. "Pixel 9". */
  deviceLabel?: string;
  /** Browser the frame simulates, e.g. "Chrome". */
  browserLabel?: string;
}

/**
 * Minimal self-contained landing page rendered via iframe srcDoc when no test
 * URL is set. It mirrors the Measure-page hero — dark surface, green
 * calibration frame with corner ticks, live size readout — and bakes the
 * simulated configuration into the page so OS-level screenshots are
 * self-describing. Kept as static HTML on purpose: the Canvas renders it
 * ~30×, the full app would cost 30 React instances.
 */
export function createPlaceholderPageHtml(context: PlaceholderPageContext = {}): string {
  const configLine = [context.deviceLabel, context.browserLabel]
    .filter(Boolean)
    .map((value) => escapeHtml(String(value)))
    .join(' · ');

  return PLACEHOLDER_PAGE_TEMPLATE.replace(
    CONFIG_SLOT,
    configLine ? `<span class="config">${configLine}</span>` : '',
  );
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

const CONFIG_SLOT = '<!--config-->';

const PLACEHOLDER_PAGE_TEMPLATE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html, body { height: 100%; margin: 0; }
  body {
    background: #14181f;
    box-sizing: border-box;
    color: rgba(255, 255, 255, 0.75);
    display: grid;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    place-items: center;
    text-align: center;
  }
  .frame, .frame::before, .frame::after { position: fixed; pointer-events: none; }
  .frame { border: 1px solid rgba(74, 222, 128, 0.85); inset: 0; }
  .frame::before, .frame::after { content: ""; height: 14px; width: 14px; }
  .frame::before { border-left: 3px solid #4ade80; border-top: 3px solid #4ade80; left: 0; top: 0; }
  .frame::after { border-bottom: 3px solid #4ade80; border-right: 3px solid #4ade80; bottom: 0; right: 0; }
  main { display: grid; gap: 0.6em; padding: 1rem; }
  .brand {
    color: #ffffff;
    font-size: clamp(0.6rem, 2.6vmin, 0.8rem);
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .brand svg { color: #4ade80; height: 0.85em; vertical-align: -0.08em; width: 0.85em; }
  .size {
    color: #4ade80;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: clamp(1.2rem, 9vmin, 3rem);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    letter-spacing: -0.03em;
  }
  .config {
    color: rgba(255, 255, 255, 0.75);
    font-size: clamp(0.65rem, 3.2vmin, 0.95rem);
    font-weight: 600;
  }
  p { color: rgba(255, 255, 255, 0.55); font-size: clamp(0.65rem, 3vmin, 0.85rem); margin: 0; }
</style>
</head>
<body>
<div class="frame" aria-hidden="true"></div>
<main>
  <span class="brand">
    <svg aria-hidden="true" viewBox="0 0 19 19">
      <g fill="none" stroke="currentColor">
        <rect height="3" width="3" x="0.5" y="0.5"/><rect height="3" width="3" x="5.5" y="0.5"/><rect height="3" width="3" x="10.5" y="0.5"/><rect height="3" width="3" x="15.5" y="0.5"/>
        <rect height="3" width="3" x="0.5" y="15.5"/><rect height="3" width="3" x="5.5" y="15.5"/><rect height="3" width="3" x="10.5" y="15.5"/><rect height="3" width="3" x="15.5" y="15.5"/>
      </g>
      <g fill="currentColor">
        <rect height="4" width="4" x="0" y="5"/><rect height="4" width="4" x="5" y="5"/><rect height="4" width="4" x="10" y="5"/><rect height="4" width="4" x="15" y="5"/>
        <rect height="4" width="4" x="0" y="10"/><rect height="4" width="4" x="5" y="10"/><rect height="4" width="4" x="10" y="10"/><rect height="4" width="4" x="15" y="10"/>
      </g>
    </svg>
    Effective Viewport
  </span>
  <span class="size" id="size"></span>
  <!--config-->
  <p>Add a test URL above to preview your own page here.</p>
</main>
<script>
  const sizeElement = document.getElementById('size');
  const updateSize = () => {
    sizeElement.textContent = innerWidth + ' \\u00d7 ' + innerHeight;
  };
  addEventListener('resize', updateSize);
  updateSize();
</script>
</body>
</html>`;
