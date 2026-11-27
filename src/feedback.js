/**
 * In-app feedback: builds pre-filled GitHub "new issue" URLs for the repo's
 * issue forms. No tokens, no API calls; the user submits on GitHub.
 *
 * Only the app version and a trimmed user agent are included. Never pass trip
 * or other user data into these URLs.
 */
export const REPO_URL = 'https://github.com/lance6x5/road-trip-packer';
const MAX_ENV = 160;

const KINDS = {
  bug: { template: 'bug_report.yml', title: '[Bug]: ' },
  feature: { template: 'feature_request.yml', title: '[Feature]: ' }
};

/** Collapse whitespace and cap the length of a user-agent string. */
export function trimEnv(ua) {
  const s = String(ua ?? '').replace(/\s+/g, ' ').trim();
  return s.length > MAX_ENV ? `${s.slice(0, MAX_ENV - 1)}…` : s;
}

/**
 * Build a new-issue URL.
 * @param {'bug'|'feature'} kind
 * @param {{version?: string, userAgent?: string}} [opts]
 */
export function issueUrl(kind, { version = '', userAgent = '' } = {}) {
  const k = KINDS[kind];
  if (!k) throw new Error(`Unknown feedback kind: ${kind}`);
  const params = new URLSearchParams({ template: k.template, title: k.title });
  if (version) params.set('version', String(version));
  if (kind === 'bug' && userAgent) params.set('environment', trimEnv(userAgent));
  // URLSearchParams encodes spaces as "+"; use %20 so GitHub shows them literally everywhere.
  return `${REPO_URL}/issues/new?${params.toString().replace(/\+/g, '%20')}`;
}

/** Point the footer feedback links at the right URLs. */
export function initFeedback(root, version) {
  if (!root) return;
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  for (const a of root.querySelectorAll('a[data-feedback]')) {
    a.href = issueUrl(a.dataset.feedback, { version, userAgent: ua });
  }
}
