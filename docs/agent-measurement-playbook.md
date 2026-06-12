# Agent measurement playbook — iOS Simulator & Android emulator

Automated calibration runs for the mobile profiles in `src/data/devices.json`.
One run produces, **per device profile**: a measurement payload (JSON) plus
OS-level screenshots, reviewed and merged as **one PR per device**.

Out of scope (measured manually on real hardware/VMs): Windows profiles,
macOS profiles, and anything Samsung Internet / One UI — the Android emulator
only models Pixel-like system UI.

## How the app supports automation

The Measure page (`?page=measure`) understands these URL parameters:

| Parameter | Effect |
| --- | --- |
| `capture` | Screenshot mode: hides interactive cards and the footer; the page stays deterministic between runs. |
| `autoreport=<url>` | POSTs the contribution payload (JSON) to `<url>` once the measurement completes. |
| `environment=emulator` | Recorded in the payload — keeps provenance honest in the dataset. |
| `osVersion=<v>` / `browserVersion=<v>` | Exact versions, passed by the agent that booted the runtime. Overrides in-browser detection (`versionSource: "provided"`). |
| `profile=<device-id>` | Device profile id from `devices.json` this run calibrates. |
| `case=<label>` | Free-form case label, e.g. `portrait`, `landscape`. |

The hero section fills exactly `100svh` and draws a 1px green frame with corner
ticks on the viewport edges — a calibration pattern. From an OS-level
screenshot you can measure the status bar, browser toolbars, and navigation
bar in pixels and cross-check them against what JavaScript reported.

The payload includes `smallViewportHeight` (100svh) and `largeViewportHeight`
(100lvh), so **both toolbar states are measured without any scroll gesture**.
Screenshots of the collapsed state are visual evidence, not the data source.

## Run setup

```bash
yarn install
yarn dev --host          # vite on http://localhost:5173, reachable from emulators
yarn collect             # collector on http://localhost:8787/collect
```

Payloads land in `measurements/<profile>--<case>--<timestamp>/payload.json`
(the folder is gitignored — results are promoted into PRs selectively).
Save screenshots into the same run directory.

Measure-page URL template (encode the `autoreport` value):

```
http://<HOST>:5173/?page=measure&capture&environment=emulator&profile=<device-id>&case=<case>&osVersion=<os>&browserVersion=<browser>&autoreport=http%3A%2F%2F<COLLECTOR_HOST>%3A8787%2Fcollect
```

- iOS Simulator: `HOST` and `COLLECTOR_HOST` are `localhost`.
- Android emulator: both are `10.0.2.2`.

## iOS (Simulator)

Requires Xcode (`xcrun simctl list devicetypes`). Map profiles to device
types — verify against the installed runtime and note any substitution:

| Profile id | Simulator device type |
| --- | --- |
| `apple-iphone-se-3` | iPhone SE (3rd generation) |
| `apple-iphone-16` | iPhone 16 |
| `apple-iphone-16-pro-max` | iPhone 16 Plus *(same 430×932 bucket)* |
| `apple-iphone-17` | iPhone 17 |
| `apple-iphone-17-pro-max` | iPhone 17 Pro Max |
| `apple-ipad-mini-portrait` | iPad mini (A17 Pro) |
| `apple-ipad-10-9-portrait` | iPad (10th generation) |
| `apple-ipad-pro-11-landscape` | iPad Pro 11-inch (M4) |
| `apple-ipad-pro-13-landscape` | iPad Pro 13-inch (M4) |

If a runtime is missing (e.g. iPhone 17 requires a current Xcode), skip the
profile and record that in the run report.

Per device:

```bash
xcrun simctl boot "<device type>"
xcrun simctl bootstatus booted               # wait for boot to finish
xcrun simctl openurl booted "<measure URL>"  # opens Safari
# wait for the collector to log the payload (~5–10 s)
xcrun simctl io booted screenshot measurements/<run-dir>/expanded.png
xcrun simctl shutdown booted
```

Notes:

- `osVersion` = the simulator runtime version (`xcrun simctl list runtimes`);
  `browserVersion` for Safari equals the iOS version.
- Match the profile's `orientation` from `devices.json`. `simctl` cannot
  rotate; if the Simulator UI is available use Device → Rotate before opening
  the URL, otherwise record the limitation in the run report.
- Collapsed-toolbar screenshot (optional evidence): drag-scroll in the
  Simulator window, then take a second screenshot as `collapsed.png`.

## Android (emulator)

Requires Android SDK cmdline tools (`sdkmanager`, `avdmanager`, `emulator`,
`adb`) and a **Google Play** system image so real Chrome is installed.

AVD geometry comes from the profile: `px = dip × dpr`, `density = dpr × 160`.

| Profile id | Resolution (px) | Density (dpi) |
| --- | --- | --- |
| `android-compact-360` | 1080 × 2400 | 480 |
| `google-pixel-9` | 1080 × 2424 | 420 *(use the `pixel_9` AVD skin)* |

Per profile:

```bash
avdmanager create avd -n ev-<profile-id> -k "system-images;android-35;google_apis_playstore;arm64-v8a" [-d pixel_9]
emulator -avd ev-<profile-id> -no-snapshot -no-boot-anim &
adb wait-for-device shell 'while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 1; done'
adb shell am start -a android.intent.action.VIEW -d "<measure URL>" com.android.chrome
# Chrome first run: dismiss dialogs via `adb shell uiautomator dump` + `adb shell input tap <x> <y>`
# wait for the collector to log the payload
adb exec-out screencap -p > measurements/<run-dir>/expanded.png
adb shell input swipe 540 1600 540 600 300        # collapse the toolbar
adb exec-out screencap -p > measurements/<run-dir>/collapsed.png
adb emu kill
```

Notes:

- `osVersion` = the system image's Android version, `browserVersion` from
  `adb shell dumpsys package com.android.chrome | grep versionName`.
- Chrome's first-run flow is the flakiest step — budget retries for it.
- A generic AVD approximates `android-compact-360` well; do **not** submit
  AVD results for `samsung-galaxy-s24` / `samsung-galaxy-tab-s9` (One UI
  differs from the emulator's Pixel-like system UI).

## Cases per device

- Profile's default orientation, toolbar expanded — payload + `expanded.png`.
- Toolbar collapsed — `collapsed.png` (Android: swipe; iOS: drag-scroll).
  The numbers are already in the payload (`largeViewportHeight`).
- Tablets additionally: the other orientation as a second case
  (`case=landscape` etc.) with its own payload + screenshot.

## From run to PR — one PR per device

1. Branch off `main`: `measurement/<device-id>`.
2. Append a measurement entry to the profile's `measurements` array in
   `src/data/devices.json` (append-only, schema: `schemas/devices.schema.json`):
   `effectiveViewport`, `smallViewportHeight`, `largeViewportHeight`,
   `measuredAt`, `osVersion`, `browserVersion`, `environment: "emulator"`,
   `verified: true`, `source: "emulator-run"`.
3. Compress screenshots (WebP or optimized PNG, ≤ 300 KB each) into
   `references/<device-id>/<case>.webp` and commit them with the dataset change.
4. PR title: `Measurement: <device-id> (emulator)`. Body must contain:
   - a table *measured vs. current estimate* (from `constraints.json` via the
     device row in the app), flagging deltas > 8 dip,
   - the runtime versions and exact reproduction URL,
   - the screenshots (they render from the PR branch),
   - what the PR changes in the dataset.
5. Do **not** modify `constraints.json` in the same PR — propose constraint
   corrections in the PR description and let review decide.

## Acceptance criteria per run

- Payload exists, validates against the schema, and has non-null
  `smallViewportHeight`, `largeViewportHeight`, `osVersion`, `browserVersion`,
  `versionSource: "provided"` and `environment: "emulator"`.
- `devicePixelRatio` and `screenWidth/Height` match the profile in
  `devices.json` — report any mismatch instead of submitting.
- Notched iPhones report non-zero `safeAreaInsets`.
- `expanded.png` shows the hero frame touching all four viewport edges with
  the browser chrome visible around it.
