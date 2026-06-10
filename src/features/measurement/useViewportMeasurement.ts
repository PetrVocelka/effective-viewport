import { useEffect, useState } from 'react';
import { measureViewport, type ViewportMeasurement } from './viewportMeasurement';

export function useViewportMeasurement(): ViewportMeasurement | null {
  const [measurement, setMeasurement] = useState<ViewportMeasurement | null>(() =>
    typeof window === 'undefined' ? null : measureViewport(),
  );

  useEffect(() => {
    const updateMeasurement = () => {
      setMeasurement(measureViewport());
    };

    window.addEventListener('resize', updateMeasurement);
    window.addEventListener('orientationchange', updateMeasurement);

    return () => {
      window.removeEventListener('resize', updateMeasurement);
      window.removeEventListener('orientationchange', updateMeasurement);
    };
  }, []);

  return measurement;
}
