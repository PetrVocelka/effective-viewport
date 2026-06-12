import { BrandMark } from './BrandMark';

interface BrandLockupProps {
  /** Page-specific tagline rendered next to the logo. */
  tagline?: string;
}

/**
 * The compact logo lockup for dark headers (canvas toolbar, measure hero):
 * wordmark + grid mark linking home, with an optional mono tagline.
 */
export function BrandLockup({ tagline }: BrandLockupProps) {
  return (
    <div className="brand-lockup">
      <a
        className="brand-lockup__name"
        href={import.meta.env.BASE_URL}
        title="Back to the full reference"
      >
        <BrandMark className="brand-lockup__mark" /> Effective Viewport
      </a>
      {tagline ? <span className="brand-lockup__tagline">{tagline}</span> : null}
    </div>
  );
}
