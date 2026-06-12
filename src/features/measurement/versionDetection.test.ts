import { describe, expect, it } from 'vitest';
import { readUserAgentVersions } from './versionDetection';

describe('readUserAgentVersions', () => {
  it('reads iOS Safari versions', () => {
    const versions = readUserAgentVersions(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 ' +
        '(KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1',
    );

    expect(versions).toEqual({ osVersion: '18.4', browserVersion: '18.4' });
  });

  it('reads Chrome on iOS via CriOS, not the Safari Version token', () => {
    const versions = readUserAgentVersions(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 ' +
        '(KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
    );

    expect(versions).toEqual({ osVersion: '18.4', browserVersion: '131.0.6778.73' });
  });

  it('reads Android Chrome versions (frozen UA still yields the placeholder OS version)', () => {
    const versions = readUserAgentVersions(
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    );

    expect(versions).toEqual({ osVersion: '10', browserVersion: '131.0.0.0' });
  });

  it('reads Samsung Internet before the generic Chrome token', () => {
    const versions = readUserAgentVersions(
      'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36',
    );

    expect(versions).toEqual({ osVersion: '14', browserVersion: '27.0' });
  });

  it('refuses to guess the Windows version from the ambiguous NT token', () => {
    const versions = readUserAgentVersions(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.2903.70',
    );

    expect(versions).toEqual({ osVersion: null, browserVersion: '131.0.2903.70' });
  });
});
