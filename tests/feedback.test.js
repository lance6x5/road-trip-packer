import { describe, it, expect } from 'vitest';
import { issueUrl, trimEnv, REPO_URL } from '../src/feedback.js';

describe('feedback issue URLs', () => {
  it('builds a pre-filled bug report URL', () => {
    const url = new URL(issueUrl('bug', { version: '1.1.0', userAgent: 'Mozilla/5.0 (X11; Linux) Firefox/130.0' }));
    expect(`${url.origin}${url.pathname}`).toBe(`${REPO_URL}/issues/new`);
    expect(url.searchParams.get('template')).toBe('bug_report.yml');
    expect(url.searchParams.get('title')).toBe('[Bug]: ');
    expect(url.searchParams.get('version')).toBe('1.1.0');
    expect(url.searchParams.get('environment')).toBe('Mozilla/5.0 (X11; Linux) Firefox/130.0');
  });

  it('builds a feature request URL without environment', () => {
    const url = new URL(issueUrl('feature', { version: '1.1.0', userAgent: 'UA' }));
    expect(url.searchParams.get('template')).toBe('feature_request.yml');
    expect(url.searchParams.get('title')).toBe('[Feature]: ');
    expect(url.searchParams.has('environment')).toBe(false);
  });

  it('encodes spaces as %20 and keeps literal plus signs', () => {
    const raw = issueUrl('bug', { version: '1.1.0', userAgent: 'A+B C' });
    expect(raw).not.toContain('+');
    expect(new URL(raw).searchParams.get('environment')).toBe('A+B C');
  });

  it('trims long user agents and keeps URLs short', () => {
    const ua = 'x '.repeat(500);
    expect(trimEnv(ua).length).toBeLessThanOrEqual(160);
    expect(issueUrl('bug', { version: '1.1.0', userAgent: ua }).length).toBeLessThan(500);
  });

  it('rejects unknown kinds', () => {
    expect(() => issueUrl('nope')).toThrow();
  });
});
