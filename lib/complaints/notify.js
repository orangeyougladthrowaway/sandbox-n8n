import fs from 'node:fs';
import path from 'node:path';
import { renderCustomerNotification, sendSimulatedEmail } from '../simulators/email.js';
import { appendLifecycleEvent } from '../schemas/complaint.js';
import { assertWritePathUnderDataRoot } from '../core/sandbox.js';

/**
 * Send simulated customer notification for a complaint.
 * @param {import('../schemas/complaint.js').ComplaintRecord} record
 * @param {{ outDir?: string }} [options]
 * @returns {{ record: import('../schemas/complaint.js').ComplaintRecord, emailPath: string }}
 */
export function notifyCustomer(record, options = {}) {
  const mail = renderCustomerNotification(record);
  let emailPath;
  if (options.outDir) {
    const filename = `${Date.now()}_notify.eml`;
    emailPath = path.join(options.outDir, filename);
    assertWritePathUnderDataRoot(emailPath);
    fs.mkdirSync(options.outDir, { recursive: true });
    fs.writeFileSync(
      emailPath,
      `To: ${mail.to}\nSubject: ${mail.subject}\nThread-ID: ${mail.thread_id}\n\n${mail.body}`,
      'utf8',
    );
  } else {
    const result = sendSimulatedEmail(mail);
    emailPath = result.filePath;
  }

  const updated = appendLifecycleEvent(
    { ...record, thread_id: mail.thread_id, status: 'pending' },
    'customer_notified',
    { emailPath },
  );

  return { record: updated, emailPath };
}
