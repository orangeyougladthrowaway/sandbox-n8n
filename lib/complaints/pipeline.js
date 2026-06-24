import fs from 'node:fs';
import path from 'node:path';
import { FileComplaintStore } from '../core/db.js';
import { normalizeInboundArtifact, assertValidComplaint } from './normalize.js';
import { classifyComplaint } from './classify.js';
import { routeComplaint } from './route.js';
import { notifyCustomer } from './notify.js';
import { processReply, extractThreadId } from './monitor.js';
import { FIXTURES_DIR, SMOKE_ROOT } from '../core/paths.js';
import { defaultSkipHttp } from '../core/sandbox.js';

/**
 * Run full complaints pipeline on one inbound file.
 * @param {string} filePath
 * @param {FileComplaintStore} store
 * @param {{ skipHttp?: boolean, outDir?: string }} [options]
 * @returns {Promise<import('../schemas/complaint.js').ComplaintRecord>}
 */
export async function processComplaintFile(filePath, store, options = {}) {
  const skipHttp = defaultSkipHttp(options.skipHttp);
  const content = fs.readFileSync(filePath, 'utf8');
  let record = normalizeInboundArtifact(filePath, content);
  record = assertValidComplaint(record);
  store.upsertComplaint(record);
  for (const evt of record.lifecycle_events) {
    store.appendEvent(record.id, evt.type, evt.detail ?? {});
  }

  record = classifyComplaint(record);
  store.upsertComplaint(record);
  store.appendEvent(record.id, 'classified', record.classification);

  record = await routeComplaint(record, { skipHttp });
  store.upsertComplaint(record);
  store.appendEvent(record.id, 'ticket_created', { ticket_ref: record.ticket_ref });

  const { record: notified } = notifyCustomer(record, { outDir: options.outDir });
  record = notified;
  store.upsertComplaint(record);
  store.appendEvent(record.id, 'customer_notified', {});

  return record;
}

/**
 * Process reply file and update linked complaint.
 * @param {string} replyPath
 * @param {FileComplaintStore} store
 * @returns {import('../schemas/complaint.js').ComplaintRecord}
 */
export function processReplyFile(replyPath, store) {
  const content = fs.readFileSync(replyPath, 'utf8');
  const threadId = extractThreadId(content);
  if (!threadId) {
    throw new Error('Reply missing Thread-ID header');
  }
  const existing = store.findByThreadId(threadId);
  if (!existing) {
    throw new Error(`No complaint found for thread: ${threadId}`);
  }
  const updated = processReply(content, existing);
  store.upsertComplaint(updated);
  store.appendEvent(updated.id, 'reply_received', {});
  return updated;
}

/**
 * Complaints smoke data root.
 * @returns {string}
 */
export function complaintsSmokeRoot() {
  return path.join(SMOKE_ROOT, 'complaints');
}

/**
 * Run idempotent complaints E2E smoke scenarios.
 * @returns {Promise<{ passed: number, scenarios: object[] }>}
 */
export async function runComplaintsSmoke() {
  const root = complaintsSmokeRoot();
  fs.rmSync(root, { recursive: true, force: true });

  const inbound = path.join(root, 'inbound', 'mailbox');
  const replies = path.join(root, 'inbound', 'mailbox', 'replies');
  const outbound = path.join(root, 'outbound', 'sent');
  const dbFile = path.join(root, 'complaints-db.json');
  fs.mkdirSync(replies, { recursive: true });

  const store = new FileComplaintStore(dbFile);
  const scenarios = [];

  const fixtures = [
    { name: 'angry-support', file: 'angry-support.eml' },
    { name: 'formal-dsar', file: 'formal-dsar.eml' },
    { name: 'compliance-action', file: 'compliance-action.eml' },
  ];

  const repoFixtures = path.join(FIXTURES_DIR, 'complaints');

  for (const fx of fixtures) {
    const src = path.join(repoFixtures, fx.file);
    const dest = path.join(inbound, fx.file);
    fs.copyFileSync(src, dest);
    const record = await processComplaintFile(dest, store, {
      skipHttp: true,
      outDir: outbound,
    });
    scenarios.push({
      name: fx.name,
      category: record.classification.category,
      ticket_ref: record.ticket_ref,
      ok: Boolean(record.ticket_ref),
    });
  }

  const dsarRecord = store.listComplaints().find((c) => c.classification.category === 'dsar');
  if (!dsarRecord) {
    throw new Error('Smoke: dsar record not found');
  }

  const replyContent = [
    `Thread-ID: ${dsarRecord.thread_id}`,
    'Subject: Re: DSAR',
    '',
    'Thank you. I am still unhappy and wish to escalate.',
  ].join('\n');
  const replyPath = path.join(replies, 'reply-dsar.eml');
  fs.writeFileSync(replyPath, replyContent, 'utf8');
  const afterReply = processReplyFile(replyPath, store);
  scenarios.push({
    name: 'reply-escalation',
    status: afterReply.status,
    ok: afterReply.status === 'escalated',
  });

  const events = store.listEvents(dsarRecord.id);
  if (events.length < 4) {
    throw new Error(`Smoke: expected lifecycle events, got ${events.length}`);
  }

  fs.rmSync(root, { recursive: true, force: true });

  return { passed: scenarios.length, scenarios };
}
