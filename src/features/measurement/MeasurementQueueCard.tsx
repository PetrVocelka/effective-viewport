import { useEffect, useRef, useState } from 'react';
import { createContributionIssueUrl } from '../contribution/contributionIssue';
import { getAvailableConstraints } from '../profiles/constraintCatalog';
import type { BrowserName } from '../profiles/profile.types';
import { createDeviceProfileEntry, createMeasurementEntry } from './datasetEntry';
import {
  clearQueue,
  type QueuedMeasurement,
  readQueue,
  removeFromQueue,
  serializeQueue,
} from './measurementQueue';

const COPY_FEEDBACK_MS = 1600;

export function MeasurementQueueCard() {
  const [queue, setQueue] = useState<QueuedMeasurement[]>(() => readQueue());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyResetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyResetTimer.current !== null) {
        window.clearTimeout(copyResetTimer.current);
      }
    },
    [],
  );

  if (!queue.length) {
    return null;
  }

  const copyToClipboard = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);

    if (copyResetTimer.current !== null) {
      window.clearTimeout(copyResetTimer.current);
    }

    copyResetTimer.current = window.setTimeout(() => setCopiedKey(null), COPY_FEEDBACK_MS);
  };

  const handleClear = () => {
    clearQueue();
    setQueue([]);
  };

  return (
    <section aria-labelledby="queue-title" className="panel">
      <p className="eyebrow">Saved on this device</p>
      <h2 id="queue-title">Measurement queue ({queue.length})</h2>
      <p className="muted">
        Measurements captured via QR codes. Copy a ready-made dataset snippet per item, send one as
        a GitHub issue, or export everything as JSON.
      </p>

      <ul className="queue-list">
        {queue.map((entry) => (
          <QueueItem
            copiedKey={copiedKey}
            entry={entry}
            key={entry.id}
            onCopy={copyToClipboard}
            onRemove={() => setQueue(removeFromQueue(entry.id))}
          />
        ))}
      </ul>

      <div className="device-row__actions">
        <button
          className="button button--secondary"
          onClick={() => copyToClipboard('queue-export', serializeQueue(queue))}
          type="button"
        >
          {copiedKey === 'queue-export' ? 'Copied!' : 'Copy raw export (JSON)'}
        </button>
        <button className="button button--secondary" onClick={handleClear} type="button">
          Clear queue
        </button>
      </div>
    </section>
  );
}

interface QueueItemProps {
  entry: QueuedMeasurement;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => Promise<void>;
  onRemove: () => void;
}

function QueueItem({ entry, copiedKey, onCopy, onRemove }: QueueItemProps) {
  const measurementEntryKey = `${entry.id}-measurement`;
  const profileEntryKey = `${entry.id}-profile`;

  return (
    <li className="queue-list__item">
      <div className="queue-list__row">
        <span className="queue-list__identity">
          <strong>{entry.deviceName || 'Unnamed device'}</strong>
          <small>
            {entry.measurement.innerWidth} × {entry.measurement.innerHeight} ·{' '}
            {entry.measurement.detectedOS} / {entry.measurement.detectedBrowser} ·{' '}
            {formatDate(entry.savedAt)}
            {entry.edgeToEdgeConfirmed ? ' · edge-to-edge' : ' · not edge-to-edge'}
          </small>
        </span>
        <button
          aria-label={`Remove ${entry.deviceName || 'unnamed device'} from queue`}
          className="queue-list__remove"
          onClick={onRemove}
          type="button"
        >
          Remove
        </button>
      </div>
      <div className="queue-list__actions">
        <button
          className="button button--small"
          onClick={() =>
            onCopy(measurementEntryKey, JSON.stringify(createMeasurementEntry(entry), null, 2))
          }
          title="For a device that already exists in devices.json — paste into its measurements array."
          type="button"
        >
          {copiedKey === measurementEntryKey ? 'Copied!' : 'Copy measurement entry'}
        </button>
        <button
          className="button button--small button--secondary"
          onClick={() =>
            onCopy(profileEntryKey, JSON.stringify(createDeviceProfileEntry(entry), null, 2))
          }
          title="For a new device — paste as a whole profile into devices.json."
          type="button"
        >
          {copiedKey === profileEntryKey ? 'Copied!' : 'Copy new device profile'}
        </button>
        <a
          className="button button--small button--secondary"
          href={createIssueUrl(entry)}
          rel="noreferrer"
          target="_blank"
        >
          Open GitHub issue
        </a>
      </div>
    </li>
  );
}

function createIssueUrl(entry: QueuedMeasurement): string {
  const browser: BrowserName =
    entry.measurement.detectedBrowser === 'unknown' ? 'chrome' : entry.measurement.detectedBrowser;

  return createContributionIssueUrl({
    browser,
    visibleChrome: getAvailableConstraints(entry.measurement.detectedOS, browser),
    edgeToEdgeConfirmed: entry.edgeToEdgeConfirmed,
    measurement: entry.measurement,
    recommendation: { name: entry.deviceName, kind: 'named' },
  });
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
