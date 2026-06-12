/**
 * Local measurement collector for emulator/VM automation runs.
 *
 * The Measure page, opened with `?autoreport=http://<host>:<port>/collect`,
 * POSTs its contribution payload here. Payloads are written to
 * `measurements/<profile>--<case>--<timestamp>/payload.json` for review;
 * screenshots taken by the automation belong in the same directory.
 *
 * Usage: node scripts/measurement-collector.mjs [port]   (default 8787)
 *
 * Emulators reach this host via:
 *   - iOS Simulator:    http://localhost:<port>/collect
 *   - Android emulator: http://10.0.2.2:<port>/collect
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number.parseInt(process.argv[2] ?? '8787', 10);
const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'measurements');

const server = createServer((request, response) => {
  // The page runs on a different origin (vite dev server) — answer CORS preflights.
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.writeHead(204).end();
    return;
  }

  if (request.method !== 'POST') {
    respondJson(response, 405, { error: 'Use POST.' });
    return;
  }

  readBody(request)
    .then((body) => {
      const payload = JSON.parse(body);
      const savedPath = savePayload(payload);

      console.log(`✓ ${describePayload(payload)} → ${savedPath}`);
      respondJson(response, 200, { saved: savedPath });
    })
    .catch((error) => {
      console.error(`✗ Rejected payload: ${error.message}`);
      respondJson(response, 400, { error: error.message });
    });
});

server.listen(PORT, () => {
  console.log(`Measurement collector listening on http://localhost:${PORT}/collect`);
  console.log(`Writing payloads to ${OUTPUT_DIR}`);
});

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function savePayload(payload) {
  const viewport = payload.measuredViewport;

  if (!viewport?.innerWidth || !viewport?.innerHeight) {
    throw new Error('Missing measuredViewport in payload.');
  }

  const directory = join(OUTPUT_DIR, buildRunName(payload));
  mkdirSync(directory, { recursive: true });

  const filePath = join(directory, 'payload.json');
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);

  return filePath;
}

function buildRunName(payload) {
  const viewport = payload.measuredViewport;
  const profile = payload.profileId ?? `${viewport.detectedOS ?? 'unknown'}-unprofiled`;
  const captureCase = payload.captureCase ?? viewport.orientation ?? 'default';
  const timestamp = (viewport.measuredAt ?? new Date().toISOString())
    .replaceAll(':', '-')
    .replace(/\.\d+Z$/, 'Z');

  return [profile, captureCase, timestamp].map(slugify).join('--');
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function describePayload(payload) {
  const viewport = payload.measuredViewport;
  const versions = `${viewport.detectedOS} ${viewport.osVersion ?? '?'} / ${
    viewport.detectedBrowser
  } ${viewport.browserVersion ?? '?'}`;

  return `${viewport.innerWidth}×${viewport.innerHeight} (${versions}, ${
    viewport.environment ?? 'hardware'
  })`;
}

function respondJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}
