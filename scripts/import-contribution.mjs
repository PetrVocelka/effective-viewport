/**
 * Imports a `profile-contribution` issue into src/data/devices.json.
 *
 * Reads the issue body from the ISSUE_BODY env var, extracts the JSON
 * measurement payload, and either appends a measurement to an existing
 * profile or adds a new profile to the `measured` list. The workflow
 * then opens a PR with the resulting diff.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEVICES_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'devices.json',
);

const issueBody = process.env.ISSUE_BODY ?? '';
const issueNumber = process.env.ISSUE_NUMBER ?? 'unknown';

const payload = extractPayload(issueBody);

if (!payload?.measuredViewport) {
  console.error(
    `Issue #${issueNumber} does not contain a valid measurement payload. Nothing to import.`,
  );
  process.exit(1);
}

const dataset = JSON.parse(readFileSync(DEVICES_PATH, 'utf8'));
const summary = importPayload(dataset, payload, issueNumber);

writeFileSync(DEVICES_PATH, `${JSON.stringify(dataset, null, 2)}\n`);
console.log(summary);

function extractPayload(body) {
  const match = /```json\s*\n([\s\S]*?)```/.exec(body);

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function importPayload(dataset, payload, issue) {
  const measurement = createMeasurementEntry(payload, issue);
  const selectedId = payload.selectedDeviceProfile?.id;

  if (selectedId) {
    const existing = [...dataset.curated, ...dataset.measured].find(
      (profile) => profile.id === selectedId,
    );

    if (existing) {
      existing.measurements.push(measurement);
      return `Appended a measurement to existing profile "${existing.id}".`;
    }
  }

  const profile = createProfile(payload, measurement);
  const duplicate = dataset.measured.find((candidate) => candidate.id === profile.id);

  if (duplicate) {
    duplicate.measurements.push(measurement);
    return `Appended a measurement to measured profile "${duplicate.id}".`;
  }

  dataset.measured.push(profile);
  return `Added new measured profile "${profile.id}".`;
}

function createMeasurementEntry(payload, issue) {
  const viewport = payload.measuredViewport;

  return {
    effectiveViewport: { width: viewport.innerWidth, height: viewport.innerHeight },
    measuredAt: viewport.measuredAt,
    verified: Boolean(payload.edgeToEdgeConfirmed),
    source: `github-issue-${issue}`,
    notes: payload.recommendedProfile?.name || undefined,
  };
}

function createProfile(payload, measurement) {
  const viewport = payload.measuredViewport;
  const os = viewport.detectedOS === 'unknown' ? 'windows' : viewport.detectedOS;
  const browser = payload.browser ?? 'chrome';
  const label = payload.recommendedProfile?.name || `Measured device (issue ${issueNumber})`;

  return {
    id: slugify(label),
    kind: payload.recommendedProfile?.kind ?? 'named',
    formFactor: guessFormFactor(viewport.screenWidth, viewport.screenHeight),
    label,
    aspectRatio: formatAspectRatio(viewport.screenWidth, viewport.screenHeight),
    dpr: viewport.devicePixelRatio,
    orientation: viewport.orientation,
    os: { name: os },
    browser: { name: browser },
    screen: { width: viewport.screenWidth, height: viewport.screenHeight },
    constraints: Array.isArray(payload.visibleChrome) ? payload.visibleChrome : ['topChrome'],
    measurements: [measurement],
    notes: 'Imported from a field measurement; review heuristic fields before merging.',
  };
}

function guessFormFactor(width, height) {
  const smallerSide = Math.min(width, height);

  if (smallerSide < 500) {
    return 'phone';
  }

  if (smallerSide < 900) {
    return 'tablet';
  }

  return 'desktop';
}

function formatAspectRatio(width, height) {
  const divisor = greatestCommonDivisor(width, height);
  const ratioWidth = width / divisor;
  const ratioHeight = height / divisor;

  if (ratioWidth <= 64 && ratioHeight <= 64) {
    return `${ratioWidth}:${ratioHeight}`;
  }

  return `${Number((width / height).toFixed(2))}:1`;
}

function greatestCommonDivisor(left, right) {
  return right === 0 ? left : greatestCommonDivisor(right, left % right);
}

function slugify(value) {
  const slug = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `measured-device-${issueNumber}`;
}
