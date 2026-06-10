/**
 * Normalizes the user-typed test URL: trims it, prepends https:// when the
 * scheme is missing, and returns null when the field is empty — callers then
 * fall back to the built-in placeholder page instead of a broken iframe.
 */
export function normalizeTestUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return null;
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Minimal self-contained landing page rendered via iframe srcDoc when no test
 * URL is set. It reports its own viewport size, so even the placeholder
 * demonstrates what the tool is about.
 */
export const PLACEHOLDER_PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html, body { height: 100%; margin: 0; }
  body {
    background:
      radial-gradient(circle, rgba(16, 24, 40, 0.07) 1px, transparent 1px) 0 0 / 22px 22px,
      #f6f7f9;
    color: #3d4654;
    display: grid;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    place-items: center;
    text-align: center;
  }
  main { display: grid; gap: 0.6em; padding: 1rem; }
  .badge {
    border: 1px solid rgba(21, 128, 61, 0.45);
    border-radius: 0.4em;
    color: #15803d;
    font-size: clamp(0.55rem, 2.2vmin, 0.72rem);
    font-weight: 700;
    justify-self: center;
    letter-spacing: 0.14em;
    padding: 0.35em 1em;
    text-transform: uppercase;
  }
  .size {
    color: #15803d;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: clamp(1.2rem, 9vmin, 3rem);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    letter-spacing: -0.03em;
  }
  p { color: #5b6573; font-size: clamp(0.65rem, 3vmin, 0.85rem); margin: 0; }
</style>
</head>
<body>
<main>
  <span class="badge">Effective viewport</span>
  <span class="size" id="size"></span>
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
