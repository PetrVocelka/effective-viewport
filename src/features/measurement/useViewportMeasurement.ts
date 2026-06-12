import { useEffect, useMemo, useRef, useState } from 'react';
import { type MeasurementContext, readMeasurementContext } from './measurementContext';
import { resolveVersionInfo, UNKNOWN_VERSION_INFO, type VersionInfo } from './versionDetection';
import { measureViewport, type ViewportMeasurement } from './viewportMeasurement';

export interface ViewportMeasurementState {
  measurement: ViewportMeasurement | null;
  /**
   * True once async version resolution settled (with or without a result) —
   * the moment the measurement is complete enough to submit anywhere.
   */
  isComplete: boolean;
}

export function useViewportMeasurement(): ViewportMeasurementState {
  const context = useMemo<MeasurementContext | null>(
    () => (typeof window === 'undefined' ? null : readMeasurementContext()),
    [],
  );
  const versionInfoRef = useRef<VersionInfo>(UNKNOWN_VERSION_INFO);
  const [isComplete, setIsComplete] = useState(false);
  const [measurement, setMeasurement] = useState<ViewportMeasurement | null>(() =>
    context === null ? null : measureViewport({ environment: context.environment }),
  );

  useEffect(() => {
    if (!context) {
      return;
    }

    const updateMeasurement = () => {
      setMeasurement(
        measureViewport({
          versionInfo: versionInfoRef.current,
          environment: context.environment,
        }),
      );
    };

    let isActive = true;

    resolveVersionInfo(context).then((versionInfo) => {
      if (isActive) {
        versionInfoRef.current = versionInfo;
        updateMeasurement();
        setIsComplete(true);
      }
    });

    window.addEventListener('resize', updateMeasurement);
    window.addEventListener('orientationchange', updateMeasurement);

    return () => {
      isActive = false;
      window.removeEventListener('resize', updateMeasurement);
      window.removeEventListener('orientationchange', updateMeasurement);
    };
  }, [context]);

  return { measurement, isComplete };
}
