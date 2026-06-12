import { describe, expect, it } from 'vitest';
import { normalizeTestUrl } from './testUrl';

describe('normalizeTestUrl', () => {
  it('returns null for an empty or whitespace-only field', () => {
    expect(normalizeTestUrl('')).toBeNull();
    expect(normalizeTestUrl('   ')).toBeNull();
  });

  it('prepends https:// when the scheme is missing', () => {
    expect(normalizeTestUrl('prumer-znamek.cz')).toBe('https://prumer-znamek.cz');
  });

  it('keeps a clean https URL as is', () => {
    expect(normalizeTestUrl('https://example.com/path?q=1')).toBe('https://example.com/path?q=1');
  });

  it('preserves explicit http for local development', () => {
    expect(normalizeTestUrl('http://localhost:5173')).toBe('http://localhost:5173');
  });

  it('repairs sloppy schemes', () => {
    expect(normalizeTestUrl('https//prumer-znamek.cz')).toBe('https://prumer-znamek.cz');
    expect(normalizeTestUrl('https:/example.com')).toBe('https://example.com');
    expect(normalizeTestUrl('https:example.com')).toBe('https://example.com');
  });

  it('collapses duplicated schemes into one', () => {
    expect(normalizeTestUrl('https://https//prumer-znamek.cz')).toBe('https://prumer-znamek.cz');
    expect(normalizeTestUrl('https://https://example.com')).toBe('https://example.com');
  });

  it('does not mistake a host starting with "http" for a scheme', () => {
    expect(normalizeTestUrl('httpsite.com')).toBe('https://httpsite.com');
  });

  it('returns null when only a scheme was typed', () => {
    expect(normalizeTestUrl('https://')).toBeNull();
  });
});
