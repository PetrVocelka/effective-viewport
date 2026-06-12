/**
 * Fictional mobile pages rendered live inside the "Why the fold matters"
 * demo at the mobile worst-case viewport — a landing page and an app screen,
 * each in two versions. Identical content, different priorities.
 */

const SHARED_STYLES = `
  * { box-sizing: border-box; margin: 0; }
  /* The demo is a static snapshot of the first screenful — no scrollbar. */
  html { overflow: hidden; }
  body { background: #ffffff; color: #101828; font-family: system-ui, -apple-system, sans-serif; }
  header {
    align-items: center;
    display: flex;
    gap: 12px;
    justify-content: space-between;
    padding: 12px 16px;
  }
  .logo { font-size: 15px; font-weight: 800; }
  .header-actions { align-items: center; display: flex; gap: 12px; }
  .burger { display: grid; gap: 4px; }
  .burger span { background: #101828; border-radius: 2px; height: 2px; width: 18px; }
  h1 { font-size: 26px; letter-spacing: -0.02em; line-height: 1.15; }
  .sub { color: #475467; font-size: 14px; line-height: 1.5; }
  /* Stands in for a hero photo — layered gradients instead of a gray box. */
  .visual {
    background:
      radial-gradient(140px 120px at 78% 18%, rgba(255, 255, 255, 0.65), transparent 70%),
      radial-gradient(220px 180px at 15% 95%, rgba(79, 70, 229, 0.3), transparent 70%),
      linear-gradient(150deg, #c7d2fe, #e9efff 55%, #f3f0ff);
  }
  .cta {
    background: #4f46e5;
    border-radius: 8px;
    color: #ffffff;
    display: inline-block;
    font-weight: 700;
    text-decoration: none;
  }
`;

/** Image first: a full screen of hero visual, the headline barely makes it. */
export const OVERSIZED_DEMO_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  ${SHARED_STYLES}
  .visual { height: 380px; width: 100%; }
  main > h1, main > .sub, main > .cta { margin: 18px 16px 0; }
  .cta { font-size: 14px; padding: 12px 24px; }
</style>
</head>
<body>
<header>
  <span class="logo">Acme</span>
  <span class="burger" aria-hidden="true"><span></span><span></span><span></span></span>
</header>
<main>
  <div class="visual" aria-hidden="true"></div>
  <h1>Ship your product twice as fast</h1>
  <p class="sub">Acme automates the busywork so your team can focus on what matters.</p>
  <a class="cta" href="#start">Start free trial</a>
</main>
</body>
</html>`;

/** Wireframe pieces shared by the two app-screen variants. */
const APP_SHARED_STYLES = `
  ${SHARED_STYLES}
  h1 { font-size: 22px; text-align: center; }
  .grid { display: grid; gap: 10px 12px; grid-template-columns: 1fr 1fr; }
  .col-label {
    color: #475467;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-align: center;
    text-transform: uppercase;
  }
  .field {
    align-items: center;
    background: #ffffff;
    border: 1px solid #e4e7ec;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
    color: #98a2b3;
    display: flex;
    font-weight: 700;
    justify-content: center;
  }
  .stat { align-items: baseline; display: flex; gap: 12px; }
  .stat strong { font-size: 24px; letter-spacing: 0.04em; }
  .stat span { color: #475467; font-size: 14px; }
  .actions { display: flex; gap: 10px; }
  .icon-btn { background: #f2f4f7; border-radius: 10px; width: 48px; }
  .primary {
    align-items: center;
    background: #4f46e5;
    border-radius: 10px;
    color: #ffffff;
    display: flex;
    flex: 1;
    font-size: 14px;
    font-weight: 700;
    justify-content: center;
  }
`;

/** Inputs up top, the result card only starts at the fold's edge. */
export const APP_SCROLL_DEMO_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  ${APP_SHARED_STYLES}
  h1 { font-size: 24px; }
  main { padding: 26px 16px; }
  .sub { margin-top: 10px; text-align: center; }
  .grid { gap: 12px; margin-top: 26px; }
  .field { height: 84px; }
  .card {
    background: #ffffff;
    border: 1px solid #e4e7ec;
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
    margin-top: 26px;
    padding: 18px;
  }
  .card-label {
    color: #475467;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .card .stat { margin-top: 14px; }
  .rule { border: 0; border-top: 1px solid #e4e7ec; margin: 14px 0; }
  .actions { margin-top: 18px; }
  .icon-btn, .primary { height: 46px; }
</style>
</head>
<body>
<header>
  <span class="logo">Acme</span>
  <span class="burger" aria-hidden="true"><span></span><span></span><span></span></span>
</header>
<main>
  <h1>Average calculator</h1>
  <p class="sub">Enter your values — the result updates instantly.</p>
  <div class="grid">
    <span class="col-label">Value</span><span class="col-label">Weight</span>
    <span class="field">–</span><span class="field">–</span>
    <span class="field">–</span><span class="field">–</span>
    <span class="field">–</span><span class="field">–</span>
  </div>
  <section class="card">
    <p class="card-label">Results</p>
    <div class="stat"><strong>–.––</strong><span>Weighted average</span></div>
    <hr class="rule">
    <div class="stat"><strong>–.––</strong><span>Simple average</span></div>
    <div class="actions">
      <span class="icon-btn"></span>
      <span class="icon-btn"></span>
      <span class="primary">Reset</span>
    </div>
  </section>
</main>
</body>
</html>`;

/** The exact same layout, just sized so everything fits above the fold. */
export const APP_VISIBLE_DEMO_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  ${APP_SHARED_STYLES}
  h1 { font-size: 18px; }
  main { padding: 12px 16px; }
  .sub { font-size: 12px; margin-top: 6px; text-align: center; }
  .grid { margin-top: 12px; }
  .col-label { font-size: 11px; }
  .field { height: 50px; }
  .card {
    background: #ffffff;
    border: 1px solid #e4e7ec;
    border-radius: 14px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
    margin-top: 12px;
    padding: 12px 14px;
  }
  .stat strong { font-size: 20px; }
  .stat span { font-size: 13px; }
  .rule { border: 0; border-top: 1px solid #e4e7ec; margin: 10px 0; }
  .actions { margin-top: 12px; }
  .icon-btn, .primary { height: 40px; }
</style>
</head>
<body>
<header>
  <span class="logo">Acme</span>
  <span class="burger" aria-hidden="true"><span></span><span></span><span></span></span>
</header>
<main>
  <h1>Average calculator</h1>
  <p class="sub">Enter your values — the result updates instantly.</p>
  <div class="grid">
    <span class="col-label">Value</span><span class="col-label">Weight</span>
    <span class="field">–</span><span class="field">–</span>
    <span class="field">–</span><span class="field">–</span>
    <span class="field">–</span><span class="field">–</span>
  </div>
  <section class="card">
    <div class="stat"><strong>–.––</strong><span>Weighted average</span></div>
    <hr class="rule">
    <div class="stat"><strong>–.––</strong><span>Simple average</span></div>
    <div class="actions">
      <span class="icon-btn"></span>
      <span class="icon-btn"></span>
      <span class="primary">Reset</span>
    </div>
  </section>
</main>
</body>
</html>`;

/** Native numeric keyboard, docked to the bottom like the real thing. */
const KEYBOARD_STYLES = `
  .keyboard {
    background: #e0e3ea;
    border-top: 1px solid #cdd2dc;
    bottom: 0;
    left: 0;
    padding: 8px 6px 12px;
    position: fixed;
    width: 100%;
  }
  .kb-bar {
    align-items: center;
    color: #4f46e5;
    display: flex;
    font-size: 14px;
    font-weight: 600;
    height: 30px;
    justify-content: flex-end;
    margin-bottom: 8px;
    padding: 0 10px;
  }
  .kb-grid { display: grid; gap: 7px; grid-template-columns: repeat(3, 1fr); }
  .key {
    align-items: center;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 1px 0 rgba(16, 24, 40, 0.25);
    color: #101828;
    display: flex;
    font-size: 18px;
    font-weight: 600;
    height: 46px;
    justify-content: center;
  }
  .key--muted { background: #c9cfda; box-shadow: none; }
  .field--focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
    color: #101828;
  }
`;

const KEYBOARD_HTML = `
<div class="keyboard" aria-hidden="true">
  <div class="kb-bar">Done</div>
  <div class="kb-grid">
    <span class="key">1</span><span class="key">2</span><span class="key">3</span>
    <span class="key">4</span><span class="key">5</span><span class="key">6</span>
    <span class="key">7</span><span class="key">8</span><span class="key">9</span>
    <span class="key key--muted">.</span><span class="key">0</span><span class="key key--muted">⌫</span>
  </div>
</div>`;

/** The "sized to fit" layout — but with the keyboard up, the result is gone. */
export const APP_KEYBOARD_HIDDEN_DEMO_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  ${APP_SHARED_STYLES}
  ${KEYBOARD_STYLES}
  h1 { font-size: 18px; }
  main { padding: 12px 16px; }
  .sub { font-size: 12px; margin-top: 6px; text-align: center; }
  .grid { margin-top: 12px; }
  .col-label { font-size: 11px; }
  .field { height: 50px; }
  .card {
    background: #ffffff;
    border: 1px solid #e4e7ec;
    border-radius: 14px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
    margin-top: 12px;
    padding: 12px 14px;
  }
  .stat strong { font-size: 20px; }
  .stat span { font-size: 13px; }
  .rule { border: 0; border-top: 1px solid #e4e7ec; margin: 10px 0; }
  .actions { margin-top: 12px; }
  .icon-btn, .primary { height: 40px; }
</style>
</head>
<body>
<header>
  <span class="logo">Acme</span>
  <span class="burger" aria-hidden="true"><span></span><span></span><span></span></span>
</header>
<main>
  <h1>Average calculator</h1>
  <p class="sub">Enter your values — the result updates instantly.</p>
  <div class="grid">
    <span class="col-label">Value</span><span class="col-label">Weight</span>
    <span class="field field--focus">2</span><span class="field">–</span>
    <span class="field">–</span><span class="field">–</span>
    <span class="field">–</span><span class="field">–</span>
  </div>
  <section class="card">
    <div class="stat"><strong>–.––</strong><span>Weighted average</span></div>
    <hr class="rule">
    <div class="stat"><strong>–.––</strong><span>Simple average</span></div>
    <div class="actions">
      <span class="icon-btn"></span>
      <span class="icon-btn"></span>
      <span class="primary">Reset</span>
    </div>
  </section>
</main>
${KEYBOARD_HTML}
</body>
</html>`;

/** Result pinned above the inputs — visible even while the keyboard is up. */
export const APP_KEYBOARD_VISIBLE_DEMO_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  ${APP_SHARED_STYLES}
  ${KEYBOARD_STYLES}
  h1 { font-size: 18px; }
  main { padding: 12px 16px; }
  .stats { display: grid; gap: 8px; grid-template-columns: 1fr 1fr; margin-top: 10px; }
  .stat-chip {
    background: #f8f9fc;
    border: 1px solid #e4e7ec;
    border-radius: 12px;
    display: grid;
    gap: 2px;
    justify-items: center;
    padding: 8px;
  }
  .stat-chip strong { font-size: 18px; letter-spacing: 0.04em; }
  .stat-chip span { color: #475467; font-size: 11px; }
  .grid { margin-top: 12px; }
  .col-label { font-size: 11px; }
  .field { height: 46px; }
</style>
</head>
<body>
<header>
  <span class="logo">Acme</span>
  <span class="burger" aria-hidden="true"><span></span><span></span><span></span></span>
</header>
<main>
  <h1>Average calculator</h1>
  <div class="stats">
    <div class="stat-chip"><strong>2.00</strong><span>Weighted average</span></div>
    <div class="stat-chip"><strong>2.00</strong><span>Simple average</span></div>
  </div>
  <div class="grid">
    <span class="col-label">Value</span><span class="col-label">Weight</span>
    <span class="field field--focus">2</span><span class="field">–</span>
    <span class="field">–</span><span class="field">–</span>
    <span class="field">–</span><span class="field">–</span>
  </div>
</main>
${KEYBOARD_HTML}
</body>
</html>`;

/** Orientation first: headline and text up top, the visual follows. */
export const EFFECTIVE_DEMO_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  ${SHARED_STYLES}
  main { padding: 20px 16px; }
  .sub { margin-top: 10px; }
  .visual { border-radius: 12px; height: 240px; margin-top: 18px; }
  .cta { font-size: 12px; padding: 8px 12px; }
</style>
</head>
<body>
<header>
  <span class="logo">Acme</span>
  <span class="header-actions">
    <a class="cta" href="#start">Start free trial</a>
    <span class="burger" aria-hidden="true"><span></span><span></span><span></span></span>
  </span>
</header>
<main>
  <h1>Ship your product twice as fast</h1>
  <p class="sub">Acme automates the busywork so your team can focus on what matters.</p>
  <div class="visual" aria-hidden="true"></div>
</main>
</body>
</html>`;
