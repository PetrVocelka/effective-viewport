import { useEffect, useRef, useState } from 'react';
import type { DeviceViewportRow } from '../devices/deviceViewports';
import { createPresetTitle } from './devtoolsPreset';

const COPY_FEEDBACK_MS = 1600;

interface DevToolsGuideProps {
  row: DeviceViewportRow;
}

interface GuideField {
  label: string;
  value: string;
  note?: string;
}

/**
 * Chrome DevTools has no JSON import for custom devices, so instead of a
 * copyable preset we list exactly what to type into the
 * "Settings → Devices → Add custom device…" form, one copy chip per field.
 */
export function DevToolsGuide({ row }: DevToolsGuideProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const copyResetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyResetTimer.current !== null) {
        window.clearTimeout(copyResetTimer.current);
      }
    },
    [],
  );

  const copyValue = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);

    if (copyResetTimer.current !== null) {
      window.clearTimeout(copyResetTimer.current);
    }

    copyResetTimer.current = window.setTimeout(() => setCopiedValue(null), COPY_FEEDBACK_MS);
  };

  const fields = createGuideFields(row);

  return (
    <div className="devtools-guide">
      <p className="devtools-guide__steps">
        DevTools → Settings <kbd>F1</kbd> → <strong>Devices</strong> →{' '}
        <strong>Add custom device…</strong> Fill in the fields below and leave the user agent string
        empty.
        {row.hasDynamicChrome
          ? ' Add two devices — one per height — to test both scroll states.'
          : ''}
      </p>
      <dl className="devtools-guide__fields">
        {fields.map((field) => (
          <div className="devtools-guide__field" key={field.label}>
            <dt>
              {field.label}
              {field.note ? <small>{field.note}</small> : null}
            </dt>
            <dd>
              <button
                className="devtools-guide__chip"
                onClick={() => copyValue(field.value)}
                title="Click to copy"
                type="button"
              >
                {copiedValue === field.value ? 'Copied!' : field.value}
              </button>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function createGuideFields(row: DeviceViewportRow): GuideField[] {
  const { profile, result } = row;
  const deviceType = profile.formFactor === 'desktop' ? 'Desktop' : 'Mobile';

  if (!row.hasDynamicChrome) {
    return [
      { label: 'Device name', value: createPresetTitle(profile, result.appliedConstraints) },
      { label: 'Width', value: String(result.viewport.width) },
      { label: 'Height', value: String(result.viewport.height) },
      { label: 'Device pixel ratio', value: String(profile.dpr) },
      { label: 'Type', value: deviceType, note: 'The dropdown next to the user agent string.' },
    ];
  }

  return [
    {
      label: 'Device name (svh)',
      value: createPresetTitle(profile, result.appliedConstraints),
      note: 'Browser UI expanded.',
    },
    {
      label: 'Device name (lvh)',
      value: createPresetTitle(profile, result.appliedConstraints, { isScrolled: true }),
      note: 'Browser UI collapsed while scrolling.',
    },
    { label: 'Width', value: String(result.viewport.width) },
    { label: 'Height (svh)', value: String(result.viewport.height) },
    { label: 'Height (lvh)', value: String(result.maxViewport.height) },
    { label: 'Device pixel ratio', value: String(profile.dpr) },
    { label: 'Type', value: deviceType, note: 'The dropdown next to the user agent string.' },
  ];
}
