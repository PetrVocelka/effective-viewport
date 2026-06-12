/**
 * Positioning manifesto: the effective viewport is an accessibility concern —
 * one that no WCAG checklist covers, yet it hits the largest audience a page has.
 */
export function AccessibilityNote() {
  return (
    <section aria-labelledby="a11y-note-title" className="section-intro chapter">
      <h2 id="a11y-note-title">The accessibility nobody audits</h2>
      <p>
        Accessibility is having a moment — audits, WCAG checklists, legal deadlines. That work
        matters; keep doing it. But somewhere along the way, accessibility got reduced to mechanical
        criteria for a small share of users — while the most common user experience of all goes
        completely unaudited: a viewport with a third of the screen eaten by toolbars, docks,
        scrollbars and keyboards.
      </p>
      <p>
        No checklist fails you when the call-to-action lands below the fold on every iPhone, or when
        the keyboard covers the form your visitor is trying to finish. Yet that is what most
        visitors hit on every single visit.{' '}
        <strong>
          Making the page work in the viewport people actually get is accessibility too — for your
          largest audience — and it should be the alpha and omega of iterating on a product.
        </strong>
      </p>
    </section>
  );
}
