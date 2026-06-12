import { useEffect, useMemo, useState } from 'react';
import { AboutProject } from './features/devices/AboutProject';
import { DevicesPage } from './features/devices/DevicesPage';
import { ImportPage } from './features/measurement/ImportPage';
import { MeasurePage } from './features/measurement/MeasurePage';
import { readMeasurementContext } from './features/measurement/measurementContext';
import {
  clearImportPayloadFromUrl,
  readImportPayloadFromUrl,
  type TransferPayload,
} from './features/measurement/measurementTransfer';
import { type AppPage, readUrlState, writeUrlState } from './features/profiles/urlState';
import { AUTHOR_AVATAR_URL } from './shared/ui/author';

export function App() {
  const initialPage = useMemo(() => readUrlState().page, []);
  const [page, setPage] = useState<AppPage>(initialPage);
  const [importPayload, setImportPayload] = useState<TransferPayload | null>(() =>
    readImportPayloadFromUrl(),
  );

  useEffect(() => {
    if (!importPayload) {
      writeUrlState({ page });
    }
  }, [page, importPayload]);

  const finishImport = () => {
    clearImportPayloadFromUrl();
    setImportPayload(null);
    setPage('measure');
  };

  const changePage = (nextPage: AppPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0 });
  };

  if (importPayload) {
    return (
      <main className="app">
        <ImportPage onDone={finishImport} payload={importPayload} />
      </main>
    );
  }

  if (page === 'measure') {
    // The hero must start at the very top edge of the viewport to demonstrate
    // (and calibrate) the fold — the measure page brings its own branding.
    const { isCaptureMode } = readMeasurementContext();

    return (
      <main className="app app--measure">
        <MeasurePage onExit={() => changePage('devices')} />
        {isCaptureMode ? null : (
          <div className="measure-content">
            <AppFooter onChangePage={changePage} />
          </div>
        )}
      </main>
    );
  }

  // The devices page closes with the dark outro panel (story, contribution
  // CTA and author) — it needs no separate footer.
  return (
    <main className="app">
      <DevicesPage />
      <AboutProject onMeasure={() => changePage('measure')} />
    </main>
  );
}

interface AppFooterProps {
  onChangePage: (page: AppPage) => void;
}

/** Measure-page footer: the way back to the reference, plus the author card. */
function AppFooter({ onChangePage }: AppFooterProps) {
  return (
    <footer className="app-footer">
      <div className="app-footer__cta">
        <div>
          <h2>Back to the reference</h2>
          <p>Done measuring? Head back to the device list and design-safe sizes.</p>
        </div>
        <button className="button" onClick={() => onChangePage('devices')} type="button">
          Browse devices
        </button>
      </div>

      <div className="app-footer__columns">
        <div className="app-footer__author">
          <img
            alt="Petr Vocelka"
            className="app-footer__avatar"
            height="56"
            src={AUTHOR_AVATAR_URL}
            width="56"
          />
          <div>
            <h2>About the author</h2>
            <p>
              Built by <strong>Petr Vocelka</strong>, a senior frontend engineer who helps startups
              and enterprises build web applications their users actually enjoy using.
            </p>
            <a
              className="linkedin-button"
              href="https://www.linkedin.com/in/petrvocelka/"
              rel="noreferrer"
              target="_blank"
            >
              <svg
                aria-hidden="true"
                fill="currentColor"
                height="16"
                viewBox="0 0 24 24"
                width="16"
              >
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0Z" />
              </svg>
              Connect on LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
