import type { ViewportMeasurement } from '../measurement/viewportMeasurement';
import type { BrowserName, ConstraintId, ProfileKind } from '../profiles/profile.types';

const GITHUB_ISSUE_URL = 'https://github.com/petrvocelka/effective-viewport/issues/new';

export interface ContributionRecommendation {
  name: string;
  kind: ProfileKind;
}

export interface MeasurementContribution {
  selectedDeviceProfile?: {
    id: string;
    label: string;
    kind: ProfileKind;
  };
  browser: BrowserName;
  visibleChrome: ConstraintId[];
  edgeToEdgeConfirmed: boolean;
  measurement: ViewportMeasurement;
  recommendation: ContributionRecommendation;
}

interface IssueUrlOptions {
  /**
   * Compact JSON keeps the URL small enough for a scannable QR code;
   * pretty JSON is friendlier when the issue is opened from a desktop link.
   */
  payloadFormat?: 'pretty' | 'compact';
}

/**
 * The canonical transfer format: used in issue bodies, JSON downloads, and
 * understood by the import GitHub Action.
 */
export function createContributionPayload(contribution: MeasurementContribution) {
  return {
    schemaVersion: 1,
    selectedDeviceProfile: contribution.selectedDeviceProfile,
    recommendedProfile: {
      name: contribution.recommendation.name,
      kind: contribution.recommendation.kind,
    },
    verified: false,
    measuredAt: contribution.measurement.measuredAt,
    environment: contribution.measurement.environment,
    osVersion: contribution.measurement.osVersion,
    browserVersion: contribution.measurement.browserVersion,
    browser: contribution.browser,
    visibleChrome: contribution.visibleChrome,
    edgeToEdgeConfirmed: contribution.edgeToEdgeConfirmed,
    measuredViewport: contribution.measurement,
  };
}

export function createContributionIssueUrl(
  contribution: MeasurementContribution,
  options: IssueUrlOptions = {},
): string {
  const payload = createContributionPayload(contribution);

  const body = [
    '## What device did you measure?',
    '',
    `Recommended name: ${contribution.recommendation.name || '(fill in)'}`,
    `Recommended category: ${contribution.recommendation.kind}`,
    `Edge-to-edge confirmed: ${contribution.edgeToEdgeConfirmed ? 'yes' : 'no'}`,
    '',
    '## Measurement payload',
    '',
    '```json',
    options.payloadFormat === 'compact'
      ? JSON.stringify(payload)
      : JSON.stringify(payload, null, 2),
    '```',
    '',
    'Privacy note: this issue is public. It may include your user agent and screen dimensions.',
  ].join('\n');

  const params = new URLSearchParams({
    template: 'profile.md',
    title: `Profile contribution: ${contribution.recommendation.name || 'Measured setup'}`,
    body,
    labels: 'profile-contribution',
  });

  return `${GITHUB_ISSUE_URL}?${params.toString()}`;
}
