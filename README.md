# Effective Viewport ▦

**What really fits above the fold.**

[![Deploy to GitHub Pages](https://github.com/PetrVocelka/effective-viewport/actions/workflows/deploy.yml/badge.svg)](https://github.com/PetrVocelka/effective-viewport/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Live: [petrvocelka.github.io/effective-viewport](https://petrvocelka.github.io/effective-viewport/)**

Your users don't see 1920×1080. Effective Viewport is a curated, measurement-backed reference
of how much browser space is *actually* left for your content — screen size minus the macOS menu
bar, the Dock, the Windows taskbar, browser toolbars, the bookmarks bar, and the scrollbar — on
the devices that matter.

Think *caniuse, but for viewports*: an open reference dataset (`devices.json` + `constraints.json`)
with a small app on top to browse, compare, simulate, and verify it.

## Why this exists

Every existing resource answers the wrong question. Screen-resolution lists and analytics tell you
the **display size**; "common viewport" tables tell you the **CSS viewport in ideal conditions**.
Nobody tells you what's left after reality takes its share:

- the macOS menu bar (taller on notched MacBooks), Dock, and Windows taskbar,
- browser toolbars and the bookmarks bar almost everyone keeps visible,
- mobile URL bars that collapse while scrolling — one device, two viewport heights (`svh`/`lvh`),
- the classic scrollbar on Windows — media queries still see the full width, but the layout doesn't,
- DPR, OS scaling, orientation, and safe areas.

If a CTA sits above the fold in a clean emulator but falls below the fold on a real notebook, UX
and conversion suffer. Effective Viewport makes that gap visible *before* you design, not after
you ship: the deliverable is a number you can design against — "on a mainstream notebook you can
count on ~660 dip above the fold."

## What you get

- **Device reference** — ~30 curated profiles (phones, tablets, laptops & desktops, edge cases),
  worst cases first. Expand a row for the full breakdown (screen − menu bar − Dock − browser UI −
  scrollbar), a to-scale wireframe with a live page preview, and a ready-made Chrome DevTools
  custom-device preset.
- **Reality-check cards** — one worst case per design breakpoint: the smallest space your
  headline, value proposition, and call to action must fit into.
- **Canvas** — a zoomable, Figma-like board with every device rendered side by side at real
  viewport size. Drop in any URL and see your page at thirty effective viewports at once.
  Every device deep-links (`?canvas=<device-id>`), so a specific case is one shareable URL.
- **Simulation toggles** — browser, bookmarks bar, dock/taskbar position, classic scrollbar
  on/off. The numbers and previews update everywhere.
- **Measure & contribute** — see what your own browser really reports and submit it to the
  dataset in a minute.

## What it is — and what it isn't

| Effective Viewport **is** | Effective Viewport **is not** |
| --- | --- |
| A reference you consult *before and while* designing | A testing tool that renders your site |
| Curated worst-case device buckets | An exhaustive database of every phone |
| Explicit numbers: min/max height, per-item chrome breakdown | A screenshot comparison service |
| Free, static, no login — open it, read the number | An analytics product telling you *who* visits |

**Why not just BrowserStack?** Different phase, different question. BrowserStack answers *"how
does my finished site behave on device X?"* — one device at a time, after the code exists, and it
never models the user's real desktop chrome (Dock, taskbar, bookmarks bar, notch). Effective
Viewport answers *"what dimensions should I design for in the first place?"* — all reference
devices in one sorted table, with copyable numbers. Use both: this tool tells you what to design
for, a device cloud verifies it works there.

## How it works

Effective viewports are **computed, not hardcoded per device**:

```
effective height = screen height − OS chrome − browser chrome
```

- `src/data/devices.json` stores device profiles: logical screen size, DPR, OS, default browser,
  and hardware-specific overrides (e.g. the taller menu bar on MacBooks with a notch).
- `src/data/constraints.json` stores reusable chrome heights per OS and per browser × OS
  (the Chrome toolbar on Android is not the Chrome toolbar on Windows).
- Mobile browser UI is dynamic: toolbars collapse while scrolling. Mobile constraints carry both
  an expanded and a collapsed height, so each mobile device shows a height **range** — design
  against the smaller value (it matches CSS `svh`).
- The classic scrollbar is modeled as a *width* constraint with a twist: it narrows the usable
  layout, but media queries, `vw`, and `innerWidth` keep reporting the full viewport width —
  which is exactly why a `100vw` element overflows.
- Safe areas (notch, home indicator) are *inside* the viewport — content renders behind them.
  They are reported as unusable zones, not subtracted from the height.

All current values are honest **estimates** until confirmed on real hardware. The
**Measure & contribute** page measures your actual browser and prefills a GitHub issue;
once reviewed, a profile earns its **verified** badge. Roughly one physical measurement per
OS × browser × form-factor cell is enough to calibrate the whole dataset.

## The device set

The dataset is intentionally small and chosen by **effective-viewport buckets**, not brands.
Devices that collapse into the same viewport are deduplicated, and each category keeps its
worst case:

- `named`: branded devices such as MacBook Pro 14", iPhone 15/16, Galaxy S24.
- `reference`: archetypes such as *Mainstream notebook FHD @ 125%* (1536×864 — the most common
  desktop viewport worldwide) or *Compact Android (360 dip)* (the most common mobile viewport).
- `edgeCase`: foldables, landscape phones, iPad Split View, ultra-wide monitors.

`schemas/*.schema.json` documents and validates the JSON shape.

## Assumptions and limitations

Values assume default OS settings (visible Dock/taskbar at default size) and a maximized browser
window. Docks get resized, taskbars auto-hide, windows don't get maximized — treat the numbers as
a **defensive lower bound**, not an exact emulation.

Ultra-wide monitors are included as edge cases, but their effective width is usually
window-driven. The strongest value of this tool is vertical space and above-the-fold testing.

## Development

```bash
yarn install
yarn dev
```

Useful checks:

```bash
yarn lint
yarn typecheck
yarn test
yarn build
```

## Deployment

Pushing to `main` builds and deploys to **GitHub Pages** automatically
(`.github/workflows/deploy.yml`). The build runs lint and tests first; the site is served from
`https://petrvocelka.github.io/effective-viewport/`.

The app is a fully static bundle — it also runs anywhere else (Cloudflare Pages, Netlify, …)
with `yarn build` and the `dist/` directory.

## Contributing

The most valuable contribution is a **measurement from real hardware** — open the
[Measure & contribute](https://petrvocelka.github.io/effective-viewport/) page on the device and
follow the prompts; it prefills a GitHub issue for you. Code and data fixes are welcome too —
see [CONTRIBUTING.md](CONTRIBUTING.md).

## Privacy

Profile contribution issues are public. They may include user agent, viewport dimensions, DPR,
screen size, and a client-generated `measuredAt` timestamp.

## License

[MIT](LICENSE)
