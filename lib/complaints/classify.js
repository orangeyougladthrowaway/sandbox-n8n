import { analyzeText } from '../simulators/aiClient.js';
import { appendLifecycleEvent } from '../schemas/complaint.js';
import { fixtureIdFromPath } from './normalize.js';

/**
 * Classify complaint text using sim AI (keyword + fixture rules).
 * @param {import('../schemas/complaint.js').ComplaintRecord} record
 * @param {{ fixtureId?: string }} [options]
 * @returns {import('../schemas/complaint.js').ComplaintRecord}
 */
export function classifyComplaint(record, options = {}) {
  const fixtureId =
    options.fixtureId ?? fixtureIdFromPath(record.raw_artifact_path);
  const analysis = analyzeText(record.normalized_text, { fixtureId });

  const updated = {
    ...record,
    classification: analysis.classification,
    sentiment: analysis.sentiment,
    requested_actions: analysis.requested_actions,
  };

  return appendLifecycleEvent(updated, 'classified', {
    fixtureId: fixtureId ?? null,
    confidence: analysis.classification.confidence,
  });
}
