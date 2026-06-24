import fs from 'node:fs';
import path from 'node:path';
import { OUTBOUND_SENT } from '../core/paths.js';
import { assertWritePathUnderDataRoot } from '../core/sandbox.js';

/**
 * Write simulated outbound email to DATA_ROOT/outbound/sent/.
 * @param {{ to: string, subject: string, body: string, thread_id?: string }} mail
 * @returns {{ filePath: string }}
 */
export function sendSimulatedEmail(mail) {
  const safeSubject = mail.subject.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
  const filename = `${Date.now()}_${safeSubject}.eml`;
  const filePath = path.join(OUTBOUND_SENT, filename);
  assertWritePathUnderDataRoot(filePath);
  const content = [
    `To: ${mail.to}`,
    `Subject: ${mail.subject}`,
    mail.thread_id ? `Thread-ID: ${mail.thread_id}` : '',
    '',
    mail.body,
  ]
    .filter(Boolean)
    .join('\n');

  fs.mkdirSync(OUTBOUND_SENT, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return { filePath };
}

/**
 * Render customer notification from complaint record.
 * @param {import('../schemas/complaint.js').ComplaintRecord} record
 * @returns {{ to: string, subject: string, body: string, thread_id: string }}
 */
export function renderCustomerNotification(record) {
  const threadId = record.thread_id || `thread_${record.id}`;
  return {
    to: 'customer@example.invalid',
    subject: `Re: Your enquiry (${record.classification.category})`,
    thread_id: threadId,
    body: [
      'Dear Customer,',
      '',
      `We have received your ${record.classification.category} enquiry.`,
      `Reference: ${record.id}`,
      record.ticket_ref ? `Ticket: ${record.ticket_ref}` : '',
      '',
      'This is an automated sandbox response.',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}
