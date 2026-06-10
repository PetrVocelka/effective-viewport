import { DevToolsGuide } from '../devtools/DevToolsGuide';
import { BROWSER_LABELS, CONSTRAINT_LABELS } from '../profiles/constraintCatalog';
import { DeviceWireframe } from './DeviceWireframe';
import { type DeviceViewportRow, formatSize } from './deviceViewports';
import { normalizeTestUrl } from './testUrl';

interface DeviceRowProps {
  row: DeviceViewportRow;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenCanvas: () => void;
  testUrl: string;
}

export function DeviceRow({ row, isExpanded, onToggle, onOpenCanvas, testUrl }: DeviceRowProps) {
  const { profile, result } = row;
  const previewUrl = normalizeTestUrl(testUrl);

  return (
    <li className={isExpanded ? 'device-row device-row--expanded' : 'device-row'}>
      <div className="device-row__header">
        <button
          aria-expanded={isExpanded}
          className="device-row__summary"
          onClick={onToggle}
          type="button"
        >
          <span className="device-row__identity">
            <span className="device-row__label">{profile.label}</span>
            <span className="device-row__meta">
              {formatOsName(profile.os.name)} · {BROWSER_LABELS[row.browser]} · screen{' '}
              {formatSize(profile.screen)} · {profile.dpr}x
            </span>
          </span>
          <span className="device-row__viewport">
            <strong>{formatSize(result.viewport)}</strong>
            {row.hasDynamicChrome ? (
              <small>up to {result.maxViewport.height} when scrolled</small>
            ) : result.totalHorizontalChrome > 0 ? (
              <small>
                −{result.totalVerticalChrome} px height · −{result.totalHorizontalChrome} px width
              </small>
            ) : (
              <small>−{result.totalVerticalChrome} px of UI</small>
            )}
          </span>
        </button>
        <span
          className={row.isVerified ? 'badge badge--verified' : 'badge'}
          title={
            row.isVerified
              ? 'Confirmed by a physical measurement.'
              : 'Calculated from the constraint dataset, not yet confirmed on hardware.'
          }
        >
          {row.isVerified ? 'verified' : 'estimate'}
        </span>
        <button
          aria-label={`Open ${profile.label} at ${formatSize(result.viewport)} in a new tab`}
          className="device-row__open"
          onClick={onOpenCanvas}
          title={`Open just this device (${formatSize(result.viewport)}) in a new tab — the link is shareable.`}
          type="button"
        >
          ↗
        </button>
      </div>

      {isExpanded ? (
        <div className="device-row__detail">
          <div className="device-row__columns">
            <div className="device-row__info">
              <section className="breakdown-card">
                <h3 className="detail-heading">How the viewport is calculated</h3>
                <dl className="breakdown">
                  <div className="breakdown__line">
                    <dt>Screen height</dt>
                    <dd>{profile.screen.height}</dd>
                  </div>
                  {result.appliedConstraints.map((constraint) => (
                    <div className="breakdown__line breakdown__line--minus" key={constraint.id}>
                      <dt>
                        {CONSTRAINT_LABELS[constraint.id]}
                        {constraint.axis === 'horizontal' ? (
                          <small>Docked to a side edge.</small>
                        ) : null}
                        {constraint.notes ? <small>{constraint.notes}</small> : null}
                      </dt>
                      <dd>
                        −{constraint.heightDip}
                        {constraint.axis === 'horizontal' ? ' width' : ''}
                      </dd>
                    </div>
                  ))}
                  <div className="breakdown__line breakdown__line--total">
                    <dt>Effective viewport</dt>
                    <dd>{formatSize(result.viewport)}</dd>
                  </div>
                  {result.scrollbar ? (
                    <>
                      <div className="breakdown__line breakdown__line--minus">
                        <dt>
                          Scrollbar
                          <small>
                            Media queries and vw still see {result.viewport.width} — only the
                            layout narrows.
                          </small>
                        </dt>
                        <dd>−{result.scrollbar.heightDip} width</dd>
                      </div>
                      <div className="breakdown__line breakdown__line--total">
                        <dt>Usable layout width</dt>
                        <dd>{result.contentWidth}</dd>
                      </div>
                    </>
                  ) : null}
                  {row.hasDynamicChrome ? (
                    <div className="breakdown__line breakdown__line--scrolled">
                      <dt>
                        While scrolling
                        <small>Mobile browser UI collapses; height grows.</small>
                      </dt>
                      <dd>{formatSize(result.maxViewport)}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              {hasSafeArea(profile) || profile.notes ? (
                <section className="device-row__notes">
                  <h3 className="detail-heading">Worth knowing</h3>
                  <ul>
                    {hasSafeArea(profile) ? (
                      <li>
                        With the browser UI visible, the notch and home indicator cover the chrome,
                        not your page. Once the bottom toolbar hides while scrolling, the home
                        indicator can overlap your content — pad fixed bottom UI with
                        env(safe-area-inset-bottom). The full insets (top{' '}
                        {profile.safeAreaInsets?.top}, bottom {profile.safeAreaInsets?.bottom})
                        only apply fullscreen or in installed PWAs.
                      </li>
                    ) : null}
                    {profile.notes ? <li>{profile.notes}</li> : null}
                  </ul>
                </section>
              ) : null}
            </div>

            <DeviceWireframe previewUrl={previewUrl} row={row} />
          </div>

          <section className="device-row__devtools">
            <h3 className="detail-heading">Chrome DevTools setup</h3>
            <DevToolsGuide row={row} />
          </section>
        </div>
      ) : null}
    </li>
  );
}

function hasSafeArea(profile: DeviceViewportRow['profile']): boolean {
  const insets = profile.safeAreaInsets;

  return Boolean(insets && (insets.top > 0 || insets.bottom > 0));
}

function formatOsName(os: string): string {
  const names: Record<string, string> = {
    macos: 'macOS',
    windows: 'Windows',
    ios: 'iOS',
    android: 'Android',
    linux: 'Linux',
    chromeos: 'ChromeOS',
  };

  return names[os] ?? os;
}
