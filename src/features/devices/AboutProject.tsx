import { AUTHOR_AVATAR_URL } from '../../shared/ui/author';

interface AboutProjectProps {
  /** Navigates to the Measure page — the chapter ends in the contribution CTA. */
  onMeasure: () => void;
}

/**
 * Dark closing panel — bookends the page with the same terminal surface as
 * the hero. One narrative: where the project comes from, why it is open
 * source and who built it.
 */
export function AboutProject({ onMeasure }: AboutProjectProps) {
  return (
    <section aria-labelledby="about-project-title" className="outro">
      <div className="outro__story">
        <h2 id="about-project-title">About the project</h2>
        <p>
          Effective Viewport grew out of years of client work — deciding what has to make it above
          the fold, and whether the page is still comfortable to use once toolbars, docks and
          keyboards take their cut. Checking that meant booting a simulator for every single
          viewport. There was no way to type one URL and see it across thirty common and tricky
          devices at once — so I built one.
        </p>
        <p>
          Data like this only works in the open: the{' '}
          <a
            href="https://github.com/PetrVocelka/effective-viewport"
            rel="noreferrer"
            target="_blank"
          >
            tool, the dataset and the methodology
          </a>{' '}
          are public, and every number is reproducible — anything marked “estimate” can be verified
          on the Measure page against real hardware or a real device simulator.
        </p>
      </div>

      <div className="outro__aside">
        <div className="outro__cta">
          <p>
            <strong>Star it, fork it, prove it wrong — or contribute a measurement.</strong> Have
            one of these devices on your desk, or a simulator on your machine? A live measurement
            turns an “estimate” into a verified value — it takes a minute.
          </p>
          <button className="outro__button" onClick={onMeasure} type="button">
            Measure &amp; contribute
          </button>
        </div>

        <div className="outro__author">
          <img
            alt="Petr Vocelka"
            className="outro__avatar"
            height="44"
            src={AUTHOR_AVATAR_URL}
            width="44"
          />
          <p>
            Built by <strong>Petr Vocelka</strong>, a senior frontend engineer who helps startups
            and enterprises build web applications their users actually enjoy using.{' '}
            <a href="https://www.linkedin.com/in/petrvocelka/" rel="noreferrer" target="_blank">
              Connect on LinkedIn
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
