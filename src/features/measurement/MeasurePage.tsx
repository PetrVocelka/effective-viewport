import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import devicesJson from '../../data/devices.json';
import {
  createContributionIssueUrl,
  createContributionPayload,
} from '../contribution/contributionIssue';
import { CONSTRAINT_LABELS, getAvailableConstraints } from '../profiles/constraintCatalog';
import type {
  BrowserName,
  ConstraintId,
  DeviceDataset,
  ProfileKind,
} from '../profiles/profile.types';
import { MeasurementQueueCard } from './MeasurementQueueCard';
import { addToQueue } from './measurementQueue';
import { createImportUrl } from './measurementTransfer';
import { useViewportMeasurement } from './useViewportMeasurement';
import type { ViewportMeasurement } from './viewportMeasurement';

const devices = devicesJson as DeviceDataset;
const allProfiles = [...devices.curated, ...devices.measured];

export function MeasurePage() {
  const measurement = useViewportMeasurement();
  const [queueVersion, setQueueVersion] = useState(0);

  return (
    <>
      <section className="measure-grid">
        <section aria-labelledby="live-viewport-title" className="panel panel--accent">
          <p className="eyebrow">Live measurement</p>
          <h2 id="live-viewport-title">This browser&rsquo;s viewport</h2>
          <p className="metric">
            {measurement ? `${measurement.innerWidth} × ${measurement.innerHeight}` : '— × —'}
          </p>
          <dl className="measurement-summary">
            <Fact
              label="Screen"
              value={measurement ? `${measurement.screenWidth} × ${measurement.screenHeight}` : '…'}
            />
            <Fact
              label="OS UI"
              value={measurement ? `${measurement.estimatedOsChromeHeight} px` : '…'}
            />
            <Fact
              label="Browser UI"
              value={measurement ? `${measurement.estimatedBrowserChromeHeight} px` : '…'}
            />
          </dl>
        </section>

        <section aria-labelledby="environment-title" className="panel">
          <p className="eyebrow">Environment</p>
          <h2 id="environment-title">What we detected</h2>
          <dl className="facts">
            <Fact
              label="OS / browser"
              value={
                measurement ? `${measurement.detectedOS} / ${measurement.detectedBrowser}` : '…'
              }
            />
            <Fact label="DPR" value={measurement ? `${measurement.devicePixelRatio}` : '…'} />
            <Fact label="Orientation" value={measurement ? measurement.orientation : '…'} />
            <Fact label="Scrollbar" value={measurement ? formatScrollbar(measurement) : '…'} />
            <Fact
              label="Safe areas"
              value={
                measurement
                  ? `top ${measurement.safeAreaInsets.top} / bottom ${measurement.safeAreaInsets.bottom}`
                  : '…'
              }
            />
          </dl>
          {measurement?.zoomWarning ? <p className="warning">{measurement.zoomWarning}</p> : null}
        </section>
      </section>

      {measurement ? <QuickCaptureCard measurement={measurement} /> : null}
      {measurement ? (
        <ContributionCard
          measurement={measurement}
          onQueueChange={() => setQueueVersion((version) => version + 1)}
        />
      ) : null}
      <MeasurementQueueCard key={queueVersion} />
    </>
  );
}

interface QuickCaptureCardProps {
  measurement: ViewportMeasurement;
}

function QuickCaptureCard({ measurement }: QuickCaptureCardProps) {
  const [isEdgeToEdgeConfirmed, setIsEdgeToEdgeConfirmed] = useState(false);
  const [isQrVisible, setIsQrVisible] = useState(false);
  const [qrTarget, setQrTarget] = useState<QrTarget>('github');

  const detectedBrowser: BrowserName =
    measurement.detectedBrowser === 'unknown' ? 'chrome' : measurement.detectedBrowser;
  const qrValue =
    qrTarget === 'github'
      ? createContributionIssueUrl(
          {
            browser: detectedBrowser,
            visibleChrome: getAvailableConstraints(measurement.detectedOS, detectedBrowser),
            edgeToEdgeConfirmed: isEdgeToEdgeConfirmed,
            measurement,
            recommendation: { name: '', kind: 'named' },
          },
          { payloadFormat: 'compact' },
        )
      : createImportUrl(measurement, isEdgeToEdgeConfirmed);

  return (
    <section aria-labelledby="quick-capture-title" className="panel">
      <p className="eyebrow">Quick capture</p>
      <h2 id="quick-capture-title">Measuring a device you can&rsquo;t log in on?</h2>
      <p className="muted">
        Kiosks, store demo devices, a colleague&rsquo;s laptop — show a QR code and scan it with
        your own phone. Nothing is needed on this device.
      </p>

      <label className="confirm-card">
        <input
          checked={isEdgeToEdgeConfirmed}
          onChange={(event) => setIsEdgeToEdgeConfirmed(event.target.checked)}
          type="checkbox"
        />
        <span>
          <strong>This window is maximized edge-to-edge on the measured display.</strong>
          <small>The flag travels with the QR code so you can trust the data later.</small>
        </span>
      </label>

      <div className="toolbar__group">
        <span className="toolbar__label" id="qr-target-label">
          Scanning the QR opens
        </span>
        <div aria-labelledby="qr-target-label" className="segmented" role="radiogroup">
          {QR_TARGET_OPTIONS.map((option) => (
            <label
              className={
                option.value === qrTarget
                  ? 'segmented__option segmented__option--active'
                  : 'segmented__option'
              }
              key={option.value}
            >
              <input
                checked={option.value === qrTarget}
                name="qr-target"
                onChange={() => setQrTarget(option.value)}
                type="radio"
                value={option.value}
              />
              {option.label}
            </label>
          ))}
        </div>
        <p className="muted muted--small">
          {qrTarget === 'github'
            ? 'A prefilled GitHub issue on your phone — just sign in and submit.'
            : 'The app on your phone — preview the measurement and queue it for later, no login needed.'}
        </p>
      </div>

      {isQrVisible ? (
        <div className="qr-block">
          <QRCodeSVG
            className="qr-block__code"
            level="L"
            marginSize={2}
            size={qrTarget === 'github' ? 288 : 232}
            value={qrValue}
          />
          <p className="muted muted--small">
            {measurement.innerWidth} × {measurement.innerHeight} · scan with your phone camera
          </p>
        </div>
      ) : (
        <button className="button" onClick={() => setIsQrVisible(true)} type="button">
          Show QR code
        </button>
      )}
    </section>
  );
}

type QrTarget = 'github' | 'app';

const QR_TARGET_OPTIONS: Array<{ value: QrTarget; label: string }> = [
  { value: 'github', label: 'GitHub issue' },
  { value: 'app', label: 'App (save for later)' },
];

interface ContributionCardProps {
  measurement: NonNullable<ReturnType<typeof useViewportMeasurement>>;
  onQueueChange: () => void;
}

function ContributionCard({ measurement, onQueueChange }: ContributionCardProps) {
  const detectedBrowser: BrowserName =
    measurement.detectedBrowser === 'unknown' ? 'chrome' : measurement.detectedBrowser;
  const availableConstraints = getAvailableConstraints(measurement.detectedOS, detectedBrowser);

  const [linkedProfileId, setLinkedProfileId] = useState('');
  const [recommendedName, setRecommendedName] = useState('');
  const [recommendedKind, setRecommendedKind] = useState<ProfileKind>('named');
  const [visibleConstraints, setVisibleConstraints] =
    useState<ConstraintId[]>(availableConstraints);
  const [isEdgeToEdgeConfirmed, setIsEdgeToEdgeConfirmed] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<'copied' | 'queued' | null>(null);

  const linkedProfile = allProfiles.find((profile) => profile.id === linkedProfileId);
  const deviceName = recommendedName.trim() || linkedProfile?.label || '';
  const contribution = {
    selectedDeviceProfile: linkedProfile
      ? { id: linkedProfile.id, label: linkedProfile.label, kind: linkedProfile.kind }
      : undefined,
    browser: detectedBrowser,
    visibleChrome: visibleConstraints,
    edgeToEdgeConfirmed: isEdgeToEdgeConfirmed,
    measurement,
    recommendation: {
      name: deviceName,
      kind: linkedProfile?.kind ?? recommendedKind,
    },
  };
  const issueUrl = createContributionIssueUrl(contribution);

  const copyJson = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify(createContributionPayload(contribution), null, 2),
    );
    setExportFeedback('copied');
    window.setTimeout(() => setExportFeedback(null), 1600);
  };

  const downloadJson = () => {
    const payload = JSON.stringify(createContributionPayload(contribution), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `effective-viewport-${measurement.measuredAt.replaceAll(':', '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveToQueue = () => {
    addToQueue(measurement, deviceName, isEdgeToEdgeConfirmed);
    onQueueChange();
    setExportFeedback('queued');
    window.setTimeout(() => setExportFeedback(null), 1600);
  };

  const toggleConstraint = (constraint: ConstraintId, isChecked: boolean) => {
    setVisibleConstraints((current) =>
      isChecked ? [...current, constraint] : current.filter((item) => item !== constraint),
    );
  };

  return (
    <section aria-labelledby="contribution-title" className="panel">
      <p className="eyebrow">Contribute</p>
      <h2 id="contribution-title">Send this measurement to the dataset</h2>
      <p className="muted">
        Maximize this window edge-to-edge first, then describe what was on screen. The measurement
        is submitted as a prefilled GitHub issue and stays unverified until reviewed.
      </p>

      <div className="contribution-fields">
        <label className="field">
          Matches a device in the dataset?
          <select
            onChange={(event) => setLinkedProfileId(event.target.value)}
            value={linkedProfileId}
          >
            <option value="">No / not sure</option>
            {allProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.label}
              </option>
            ))}
          </select>
        </label>

        {!linkedProfile ? (
          <>
            <label className="field">
              Device name
              <input
                onChange={(event) => setRecommendedName(event.target.value)}
                placeholder='e.g. MacBook Air 13"'
                type="text"
                value={recommendedName}
              />
            </label>
            <label className="field">
              Category
              <select
                onChange={(event) => setRecommendedKind(event.target.value as ProfileKind)}
                value={recommendedKind}
              >
                <option value="named">Named device</option>
                <option value="reference">Reference profile</option>
                <option value="edgeCase">Edge case</option>
              </select>
            </label>
          </>
        ) : null}
      </div>

      <fieldset className="toggle-group">
        <legend>UI visible during the measurement</legend>
        <div className="toggle-grid">
          {availableConstraints.map((constraint) => (
            <label className="toggle-card" key={constraint}>
              <input
                checked={visibleConstraints.includes(constraint)}
                className="switch-input"
                onChange={(event) => toggleConstraint(constraint, event.target.checked)}
                type="checkbox"
              />
              <span aria-hidden="true" className="switch-control" />
              <span>{CONSTRAINT_LABELS[constraint]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="confirm-card">
        <input
          checked={isEdgeToEdgeConfirmed}
          onChange={(event) => setIsEdgeToEdgeConfirmed(event.target.checked)}
          type="checkbox"
        />
        <span>
          <strong>This window is maximized edge-to-edge on the measured display.</strong>
          <small>Otherwise the numbers describe your window, not the device.</small>
        </span>
      </label>

      <div className="device-row__actions">
        {isEdgeToEdgeConfirmed ? (
          <a className="button" href={issueUrl} rel="noreferrer" target="_blank">
            Open prefilled GitHub issue
          </a>
        ) : (
          <button className="button" disabled type="button">
            Confirm edge-to-edge first
          </button>
        )}
        <button className="button button--secondary" onClick={saveToQueue} type="button">
          {exportFeedback === 'queued' ? 'Saved!' : 'Save to queue'}
        </button>
        <button className="button button--secondary" onClick={copyJson} type="button">
          {exportFeedback === 'copied' ? 'Copied!' : 'Copy JSON'}
        </button>
        <button className="button button--secondary" onClick={downloadJson} type="button">
          Download JSON
        </button>
      </div>

      <p className="muted muted--small">
        The issue is public and includes your user agent, screen size, and viewport dimensions. No
        GitHub account? Save the measurement to the local queue or export the JSON — the file uses
        the same format the import automation understands.
      </p>
    </section>
  );
}

function formatScrollbar(measurement: ViewportMeasurement): string {
  return measurement.scrollbarWidth > 0
    ? `${measurement.scrollbarWidth} px classic`
    : 'overlay (0 px)';
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
