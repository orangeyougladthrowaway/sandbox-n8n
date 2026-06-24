/**
 * Deterministic AI simulator — keyword/fixture driven classification.
 * Same interface shape as a future production aiClient.
 */

const RULES = [
  {
    keywords: ['subject access', 'dsar', 'my data', 'gdpr request'],
    category: 'dsar',
    actions: ['DSAR'],
    sentiment: { score: -0.2, label: 'concerned' },
    rationale: 'Keywords indicate a data subject access request',
  },
  {
    keywords: ['formal complaint', 'ombudsman', 'escalate', 'unacceptable service'],
    category: 'formal_complaint',
    actions: ['FORMAL'],
    sentiment: { score: -0.7, label: 'angry' },
    rationale: 'Language indicates formal complaint escalation',
  },
  {
    keywords: ['fca', 'compliance', 'regulatory', 'breach notification'],
    category: 'compliance',
    actions: ['COMPLIANCE'],
    sentiment: { score: -0.5, label: 'serious' },
    rationale: 'Regulatory or compliance matter detected',
  },
  {
    keywords: ['solicitor', 'legal action', 'lawyer', 'litigation'],
    category: 'legal',
    actions: ['LEGAL'],
    sentiment: { score: -0.8, label: 'hostile' },
    rationale: 'Legal threat language detected',
  },
];

/**
 * Analyze text for classification and sentiment (deterministic).
 * @param {string} text
 * @param {{ fixtureId?: string }} [options]
 * @returns {{ classification: object, sentiment: object, requested_actions: string[] }}
 */
export function analyzeText(text, options = {}) {
  const lower = (text || '').toLowerCase();

  if (options.fixtureId === 'angry-support') {
    return {
      classification: {
        category: 'support',
        confidence: 0.85,
        rationale: 'Fixture: angry support complaint',
      },
      sentiment: { score: -0.6, label: 'frustrated' },
      requested_actions: ['SUPPORT_ONLY'],
    };
  }
  if (options.fixtureId === 'formal-dsar') {
    return {
      classification: {
        category: 'dsar',
        confidence: 0.92,
        rationale: 'Fixture: formal DSAR request',
      },
      sentiment: { score: -0.3, label: 'formal' },
      requested_actions: ['DSAR', 'FORMAL'],
    };
  }
  if (options.fixtureId === 'compliance-action') {
    return {
      classification: {
        category: 'compliance',
        confidence: 0.88,
        rationale: 'Fixture: compliance regulatory matter',
      },
      sentiment: { score: -0.5, label: 'serious' },
      requested_actions: ['COMPLIANCE'],
    };
  }

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return {
        classification: {
          category: rule.category,
          confidence: 0.75,
          rationale: rule.rationale,
        },
        sentiment: rule.sentiment,
        requested_actions: rule.actions,
      };
    }
  }

  return {
    classification: {
      category: 'support',
      confidence: 0.5,
      rationale: 'Default: general support inquiry',
    },
    sentiment: { score: 0, label: 'neutral' },
    requested_actions: ['SUPPORT_ONLY'],
  };
}

/**
 * Summarize exception text for daily checks (deterministic stub).
 * @param {string} text
 * @returns {{ summary: string, hypothesized_cause: string }}
 */
export function summarizeException(text) {
  const lower = (text || '').toLowerCase();
  if (lower.includes('null') || lower.includes('missing')) {
    return {
      summary: 'Data integrity issue: missing or null values detected',
      hypothesized_cause: 'Upstream feed dropped required fields',
    };
  }
  if (lower.includes('stale') || lower.includes('lag')) {
    return {
      summary: 'Pipeline lag exceeds threshold',
      hypothesized_cause: 'Batch job delayed or failed silently',
    };
  }
  return {
    summary: 'Operational exception requires review',
    hypothesized_cause: 'Unknown — manual triage recommended',
  };
}
