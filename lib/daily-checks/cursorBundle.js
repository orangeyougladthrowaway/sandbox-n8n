import fs from 'node:fs';
import path from 'node:path';
import { CURSOR_REQUESTS } from '../core/paths.js';
import { assertWritePathUnderDataRoot } from '../core/sandbox.js';
import { newId } from '../core/logging.js';

/**
 * Write Cursor investigation bundle for an exception.
 * @param {object} params
 * @param {string} params.checkRunId
 * @param {object} params.row
 * @param {object} params.triage
 * @param {object} params.summary
 * @param {string} [params.outRoot]
 * @returns {string} bundle directory path
 */
export function writeCursorBundle(params) {
  const outRoot = params.outRoot ?? CURSOR_REQUESTS;
  const bundleDir = path.join(outRoot, params.checkRunId, params.row.id);
  assertWritePathUnderDataRoot(bundleDir);
  fs.mkdirSync(bundleDir, { recursive: true });

  const context = {
    exception_id: params.row.id,
    message: params.row.message,
    severity: params.row.severity,
    triage: params.triage,
    summary: params.summary,
  };
  fs.writeFileSync(path.join(bundleDir, 'context.json'), JSON.stringify(context, null, 2), 'utf8');
  fs.writeFileSync(
    path.join(bundleDir, 'prompt.md'),
    `# Investigate ${params.row.id}\n\n${params.summary.summary}\n\nHypothesis: ${params.summary.hypothesized_cause}\n`,
    'utf8',
  );
  fs.writeFileSync(
    path.join(bundleDir, 'fixture-response.json'),
    JSON.stringify({ suggested_fix: 'Review upstream feed mapping', confidence: 0.7 }, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(bundleDir, 'pr-summary.md'),
    `## Fix ${params.row.id}\n\n- ${params.summary.hypothesized_cause}\n`,
    'utf8',
  );
  return bundleDir;
}

/**
 * @returns {string}
 */
export function newCheckRunId() {
  return newId('check_run');
}
