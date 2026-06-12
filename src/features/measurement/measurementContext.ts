export type MeasurementEnvironment = 'hardware' | 'emulator';

/**
 * Automation-facing URL parameters of the Measure page. Agents driving
 * emulators pass exact versions out-of-band (they picked the runtime),
 * which beats any in-browser detection.
 */
export interface MeasurementContext {
  environment: MeasurementEnvironment;
  providedOsVersion: string | null;
  providedBrowserVersion: string | null;
  /** Collector endpoint — when set, the page POSTs its payload there on load. */
  autoreportUrl: string | null;
  /** Screenshot mode: hides interactive UI and keeps the page deterministic. */
  isCaptureMode: boolean;
  /** Device profile id from devices.json the run is calibrating. */
  profileId: string | null;
  /** Free-form case label, e.g. "portrait-expanded". */
  captureCase: string | null;
}

export function readMeasurementContext(): MeasurementContext {
  const params = new URLSearchParams(window.location.search);

  return {
    environment: params.get('environment') === 'emulator' ? 'emulator' : 'hardware',
    providedOsVersion: params.get('osVersion'),
    providedBrowserVersion: params.get('browserVersion'),
    autoreportUrl: params.get('autoreport'),
    isCaptureMode: params.has('capture'),
    profileId: params.get('profile'),
    captureCase: params.get('case'),
  };
}
