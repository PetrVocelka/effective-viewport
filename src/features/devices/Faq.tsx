import type { ReactNode } from 'react';

interface FaqEntry {
  id: string;
  question: string;
  answer: ReactNode;
}

const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: 'iframe-blocked',
    question: 'I entered my URL, but the previews stay on the placeholder or show an error.',
    answer: (
      <>
        <p>
          That's your site protecting itself, and it's the correct behavior: pages that send{' '}
          <code>X-Frame-Options</code> or a CSP <code>frame-ancestors</code> header refuse to be
          embedded in iframes on other sites — the standard defense against clickjacking. Everything
          here runs in your browser, so there is deliberately no server-side proxy working around
          it. Three ways to test anyway:
        </p>
        <ul>
          <li>
            <strong>Point it at your local dev server</strong> — type{' '}
            <code>http://localhost:3000</code> (or whatever port you use). Dev servers usually don't
            send those headers, so this just works.
          </li>
          <li>
            <strong>Allowlist this origin on staging</strong> — add it to your{' '}
            <code>frame-ancestors</code> CSP directive there. (<code>X-Frame-Options</code> can't
            allowlist; that needs CSP.) Keep production locked down.
          </li>
          <li>
            <strong>Self-host the tool</strong> — it's open source, so you can run it inside your
            own network next to your app, where you control the headers.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'spec-sheet',
    question: "Why don't the numbers match the resolution on the device's spec sheet?",
    answer: (
      <p>
        Spec sheets list physical pixels — an iPhone 15 says 1179 × 2556. CSS works in
        device-independent pixels, so the browser sees 393 × 852 to begin with. Then the parts of
        the screen your page never gets are subtracted: browser UI, OS bars, scrollbars and — opt-in
        — the on-screen keyboard. What's left is the effective viewport, and that's the number shown
        here.
      </p>
    ),
  },
  {
    id: 'accuracy',
    question: 'How accurate are the numbers?',
    answer: (
      <p>
        Every value carries its source. Numbers marked <strong>verified</strong> were measured on a
        real device or a real-device simulator with the Measure page — the system UI is identical,
        so both count fully. Numbers marked <strong>estimate</strong> come from documentation and
        screenshots and are still waiting for a measurement. Treat the results as the defensive
        minimum with default OS settings — and if you have one of the estimated devices on your desk
        or in a simulator, a one-minute measurement turns the estimate into a verified value for
        everyone.
      </p>
    ),
  },
  {
    id: 'privacy',
    question: 'Where does the URL I type get sent?',
    answer: (
      <p>
        Nowhere. The whole tool runs in your browser — the URL is loaded straight into the preview
        iframes on your machine and never touches a server of ours. It only appears in your address
        bar so you can share the exact view with a colleague as a link.
      </p>
    ),
  },
];

/**
 * Native <details> accordion — keyboard accessible and crawlable
 * without a line of JavaScript.
 */
export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="faq chapter">
      <header className="section-intro">
        <h2 id="faq-title">Frequently asked questions</h2>
      </header>
      {FAQ_ENTRIES.map((entry) => (
        <details className="faq__item" key={entry.id}>
          <summary className="faq__question">{entry.question}</summary>
          <div className="faq__answer">{entry.answer}</div>
        </details>
      ))}
    </section>
  );
}
