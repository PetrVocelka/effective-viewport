import type { ViewportMeasurement } from './viewportMeasurement';

const IMPORT_PARAM = 'import';
const PAYLOAD_VERSION = 1;

export interface TransferPayload {
  version: number;
  edgeToEdgeConfirmed: boolean;
  measurement: ViewportMeasurement;
}

interface WirePayload {
  v: number;
  e: boolean;
  m: ViewportMeasurement;
}

export function createImportUrl(
  measurement: ViewportMeasurement,
  edgeToEdgeConfirmed: boolean,
  baseUrl: string = `${window.location.origin}${window.location.pathname}`,
): string {
  const wirePayload: WirePayload = {
    v: PAYLOAD_VERSION,
    e: edgeToEdgeConfirmed,
    m: measurement,
  };

  return `${baseUrl}?${IMPORT_PARAM}=${toBase64Url(JSON.stringify(wirePayload))}`;
}

export function decodeImportPayload(rawValue: string): TransferPayload | null {
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(rawValue));

    if (!isWirePayload(parsed)) {
      return null;
    }

    return {
      version: parsed.v,
      edgeToEdgeConfirmed: parsed.e,
      measurement: parsed.m,
    };
  } catch {
    return null;
  }
}

export function readImportPayloadFromUrl(): TransferPayload | null {
  const rawValue = new URLSearchParams(window.location.search).get(IMPORT_PARAM);

  return rawValue ? decodeImportPayload(rawValue) : null;
}

export function clearImportPayloadFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  params.delete(IMPORT_PARAM);
  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', nextUrl);
}

function isWirePayload(value: unknown): value is WirePayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<WirePayload>;
  const measurement = candidate.m as Partial<ViewportMeasurement> | undefined;

  return (
    candidate.v === PAYLOAD_VERSION &&
    typeof candidate.e === 'boolean' &&
    typeof measurement === 'object' &&
    measurement !== null &&
    typeof measurement.innerWidth === 'number' &&
    typeof measurement.innerHeight === 'number' &&
    typeof measurement.screenWidth === 'number' &&
    typeof measurement.screenHeight === 'number' &&
    typeof measurement.measuredAt === 'string'
  );
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}
