# Contributing

Thanks for helping improve Effective Viewport.

## Profile contributions

The easiest path is the app's **Contribute this profile** button. It opens a prefilled GitHub issue
with structured JSON.

Issues labeled `profile-contribution` are picked up by a GitHub Action
(`.github/workflows/import-contribution.yml`) that imports the measurement payload into
`src/data/devices.json` and opens a pull request. Review the heuristic fields (formFactor,
aspectRatio, constraints) before merging.

If you measured a device offline (QR kiosk flow), the **Measurement queue** on the Measure page
offers per-item shortcuts: copy a ready-made `devices.json` snippet (measurement entry or a whole
new profile) or open a prefilled GitHub issue.

Please add the marketing name of the device when you know it, for example:

- `MacBook Pro 14" (M3 Pro)`
- `Surface Laptop 15"`
- `Galaxy Z Fold (unfolded)`

Incoming community measurements should be treated as `verified: false` until reviewed.

Measurements from emulators and VMs are welcome — record them with
`environment: "emulator"`. Automated emulator runs (iOS Simulator, Android
emulator) are described in [docs/agent-measurement-playbook.md](docs/agent-measurement-playbook.md).

## Dataset rules

- Keep `schemaVersion` in place.
- Use stable `id` values.
- Prefer a small curated reference dataset over many near-duplicates.
- Add new measurements append-only; do not delete historical values unless they are invalid.
- Use ISO 8601 UTC timestamps for `measuredAt`.
- Put OS/browser UI constants in `src/data/constraints.json`, not inside device profiles.
- Use `reference` profiles for generic archetypes and `edgeCase` profiles for unusual displays.

## Local checks

```bash
yarn lint
yarn typecheck
yarn test
yarn build
```
