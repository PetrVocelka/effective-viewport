import { useEffect, useRef, useState } from 'react';
import devicesJson from '../../data/devices.json';
import { createContributionPayload } from '../contribution/contributionIssue';
import { getAvailableConstraints } from '../profiles/constraintCatalog';
import type { BrowserName, DeviceDataset } from '../profiles/profile.types';
import type { MeasurementContext } from './measurementContext';
import type { ViewportMeasurement } from './viewportMeasurement';

const devices = devicesJson as DeviceDataset;
const allProfiles = [...devices.curated, ...devices.measured];

export type AutoreportStatus = 'off' | 'reporting' | 'reported' | 'failed';

/**
 * Automation mode: POSTs the measurement payload to the collector endpoint
 * from the `autoreport` URL parameter once the measurement is complete.
 * Emulator browsers always run edge-to-edge, so the flag is set upfront.
 */
export function useAutoreport(
  context: MeasurementContext | null,
  measurement: ViewportMeasurement | null,
  isMeasurementComplete: boolean,
): AutoreportStatus {
  const [status, setStatus] = useState<AutoreportStatus>(() =>
    context?.autoreportUrl ? 'reporting' : 'off',
  );
  const hasReportedRef = useRef(false);

  useEffect(() => {
    if (!context?.autoreportUrl || !measurement || !isMeasurementComplete) {
      return;
    }

    if (hasReportedRef.current) {
      return;
    }

    hasReportedRef.current = true;

    fetch(context.autoreportUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createAutoreportPayload(context, measurement)),
    })
      .then((response) => setStatus(response.ok ? 'reported' : 'failed'))
      .catch(() => setStatus('failed'));
  }, [context, measurement, isMeasurementComplete]);

  return status;
}

function createAutoreportPayload(context: MeasurementContext, measurement: ViewportMeasurement) {
  const browser: BrowserName =
    measurement.detectedBrowser === 'unknown' ? 'chrome' : measurement.detectedBrowser;
  const linkedProfile = allProfiles.find((profile) => profile.id === context.profileId);

  return {
    ...createContributionPayload({
      selectedDeviceProfile: linkedProfile
        ? { id: linkedProfile.id, label: linkedProfile.label, kind: linkedProfile.kind }
        : undefined,
      browser,
      visibleChrome: getAvailableConstraints(measurement.detectedOS, browser),
      edgeToEdgeConfirmed: true,
      measurement,
      recommendation: {
        name: linkedProfile?.label ?? '',
        kind: linkedProfile?.kind ?? 'named',
      },
    }),
    profileId: context.profileId,
    captureCase: context.captureCase,
  };
}
