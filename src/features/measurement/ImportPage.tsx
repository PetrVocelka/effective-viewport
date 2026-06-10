import { useState } from 'react';
import { createContributionIssueUrl } from '../contribution/contributionIssue';
import { getAvailableConstraints } from '../profiles/constraintCatalog';
import type { BrowserName } from '../profiles/profile.types';
import { addToQueue } from './measurementQueue';
import type { TransferPayload } from './measurementTransfer';

interface ImportPageProps {
  payload: TransferPayload;
  onDone: () => void;
}

export function ImportPage({ payload, onDone }: ImportPageProps) {
  const { measurement, edgeToEdgeConfirmed } = payload;
  const [deviceName, setDeviceName] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const detectedBrowser: BrowserName =
    measurement.detectedBrowser === 'unknown' ? 'chrome' : measurement.detectedBrowser;
  const issueUrl = createContributionIssueUrl({
    browser: detectedBrowser,
    visibleChrome: getAvailableConstraints(measurement.detectedOS, detectedBrowser),
    edgeToEdgeConfirmed,
    measurement,
    recommendation: { name: deviceName.trim(), kind: 'named' },
  });

  const handleSave = () => {
    addToQueue(measurement, deviceName.trim(), edgeToEdgeConfirmed);
    setIsSaved(true);
  };

  return (
    <section aria-labelledby="import-title" className="panel panel--accent import-panel">
      <p className="eyebrow">Scanned measurement</p>
      <h2 id="import-title">Measurement received</h2>
      <p className="metric">
        {measurement.innerWidth} × {measurement.innerHeight}
      </p>

      <dl className="measurement-summary">
        <Fact label="Screen" value={`${measurement.screenWidth} × ${measurement.screenHeight}`} />
        <Fact
          label="OS / browser"
          value={`${measurement.detectedOS} / ${measurement.detectedBrowser}`}
        />
        <Fact label="DPR" value={`${measurement.devicePixelRatio}`} />
        <Fact label="Edge-to-edge" value={edgeToEdgeConfirmed ? 'confirmed' : 'not confirmed'} />
        <Fact label="Measured" value={formatDate(measurement.measuredAt)} />
      </dl>

      <label className="field field--on-accent">
        What device was this?
        <input
          onChange={(event) => setDeviceName(event.target.value)}
          placeholder='e.g. Mall kiosk, Samsung 24" portrait'
          type="text"
          value={deviceName}
        />
      </label>

      <div className="device-row__actions">
        {isSaved ? (
          <button className="button" disabled type="button">
            Saved to queue ✓
          </button>
        ) : (
          <button className="button" onClick={handleSave} type="button">
            Save to queue on this phone
          </button>
        )}
        <a className="button button--secondary" href={issueUrl} rel="noreferrer" target="_blank">
          Open GitHub issue
        </a>
        <button className="button button--ghost" onClick={onDone} type="button">
          {isSaved ? 'Done' : 'Discard'}
        </button>
      </div>
    </section>
  );
}

interface FactProps {
  label: string;
  value: string;
}

function Fact({ label, value }: FactProps) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
