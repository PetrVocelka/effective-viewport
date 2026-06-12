import {
  APP_KEYBOARD_HIDDEN_DEMO_HTML,
  APP_KEYBOARD_VISIBLE_DEMO_HTML,
  APP_SCROLL_DEMO_HTML,
  APP_VISIBLE_DEMO_HTML,
  EFFECTIVE_DEMO_HTML,
  OVERSIZED_DEMO_HTML,
} from './foldDemoPages';

/** The mobile worst case from the summary above — the demo renders at it.
    Display size and scale live in CSS (`--fold-demo-*`). */
const DEMO_WIDTH = 344;
const DEMO_HEIGHT = 514;

/**
 * Learning section: the same landing page twice at the worst-case mobile
 * viewport — once laid out on a big display (CTA lost below the fold),
 * once laid out for the effective viewport (message and CTA survive).
 */
export function FoldDemo() {
  return (
    <section aria-labelledby="fold-demo-title" className="fold-demo chapter">
      <header className="section-intro">
        <h2 id="fold-demo-title">Why the fold matters</h2>
        <p>
          The same screen, side by side — everything shown at <strong>344 × 514 px</strong>, the
          mobile worst case from the cards above. People do scroll, the fold isn't a wall — but the
          first screenful decides whether they want to. Every answer they have to scroll for costs
          attention (and yes, conversions too).
        </p>
        <p>These are the checks your page silently has to pass:</p>
        {/* Ordered as the visitor's journey: get it → act on it → interact with it.
            Deliberately unchecked — the demos below show each one failing and passing. */}
        <ul aria-label="The checks your page silently has to pass" className="fold-demo__checks">
          <li>understand what you offer at a glance</li>
          <li>find the call-to-action without scrolling</li>
          <li>finish the form with the keyboard up</li>
          <li>reach every button</li>
        </ul>
      </header>
      <div className="fold-demo__use-cases">
        <div className="fold-demo__block">
          <header className="fold-demo__block-header">
            <span className="fold-demo__index">Case 01</span>
            <h3 className="fold-demo__use-case">The landing page</h3>
            <p className="fold-demo__use-case-note">
              Does the visitor learn what this is — without scrolling?
            </p>
          </header>
          <div className="fold-demo__pair">
            <FoldDemoCase
              isPass={false}
              label="Image first"
              srcDoc={OVERSIZED_DEMO_HTML}
              verdict="A full screen of visual — the visitor has to scroll just to find out what the page is about."
            />
            <FoldDemoCase
              isPass
              label="Orientation first"
              srcDoc={EFFECTIVE_DEMO_HTML}
              verdict="What it is, why it matters, where to go next — and the visual still fits."
            />
          </div>
        </div>

        <div className="fold-demo__block">
          <header className="fold-demo__block-header">
            <span className="fold-demo__index">Case 02</span>
            <h3 className="fold-demo__use-case">The app</h3>
            <p className="fold-demo__use-case-note">
              When feedback lives below the fold, every interaction costs a scroll.
            </p>
          </header>
          <div className="fold-demo__pair">
            <FoldDemoCase
              isPass={false}
              label="Result below the fold"
              srcDoc={APP_SCROLL_DEMO_HTML}
              verdict="Type, scroll, check, scroll back — the result is never visible while you enter values."
            />
            <FoldDemoCase
              isPass
              label="Result in sight"
              srcDoc={APP_VISIBLE_DEMO_HTML}
              verdict="The exact same layout, just sized for the worst case — inputs, result and actions all fit."
            />
          </div>
        </div>

        <div className="fold-demo__block">
          <header className="fold-demo__block-header">
            <span className="fold-demo__index">Case 03</span>
            <h3 className="fold-demo__use-case">The keyboard</h3>
            <p className="fold-demo__use-case-note">
              Tap an input and the native keyboard claims half the screen — while typing, the
              effective viewport shrinks to roughly <strong>344 × 250 px</strong>.
            </p>
          </header>
          <div className="fold-demo__pair">
            <FoldDemoCase
              isPass={false}
              label="Result behind the keyboard"
              srcDoc={APP_KEYBOARD_HIDDEN_DEMO_HTML}
              verdict="The layout that fit a moment ago — open the keyboard and the result vanishes behind it."
            />
            <FoldDemoCase
              isPass
              label="Result pinned on top"
              srcDoc={APP_KEYBOARD_VISIBLE_DEMO_HTML}
              verdict="The result moved above the inputs — you watch it update while you type."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

interface FoldDemoCaseProps {
  label: string;
  srcDoc: string;
  verdict: string;
  isPass: boolean;
}

function FoldDemoCase({ label, srcDoc, verdict, isPass }: FoldDemoCaseProps) {
  return (
    <figure className="fold-demo__case">
      <figcaption className="fold-demo__label">{label}</figcaption>
      <div aria-hidden="true" className="fold-demo__screen">
        <div className="fold-demo__viewport">
          <iframe
            className="fold-demo__preview"
            height={DEMO_HEIGHT}
            srcDoc={srcDoc}
            tabIndex={-1}
            title={label}
            width={DEMO_WIDTH}
          />
        </div>
      </div>
      <p className={isPass ? 'fold-demo__verdict fold-demo__verdict--pass' : 'fold-demo__verdict'}>
        <span aria-hidden="true" className="fold-demo__mark">
          {isPass ? '✓' : '✗'}
        </span>
        {verdict}
      </p>
    </figure>
  );
}
