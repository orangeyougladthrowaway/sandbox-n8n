import fs from 'node:fs';
import path from 'node:path';
import { FIXTURES_DIR, DATA_ROOT } from '../lib/core/paths.js';
import { FileComplaintStore } from '../lib/core/db.js';
import { processComplaintFile } from '../lib/complaints/pipeline.js';

const inbound = path.join(DATA_ROOT, 'inbound', 'mailbox');
const dbFile = path.join(DATA_ROOT, '_runtime', 'complaints-db.json');
fs.mkdirSync(inbound, { recursive: true });

const store = new FileComplaintStore(dbFile);
const fixtures = ['angry-support.eml', 'formal-dsar.eml', 'compliance-action.eml'];

for (const file of fixtures) {
  const src = path.join(FIXTURES_DIR, 'complaints', file);
  const dest = path.join(inbound, file);
  fs.copyFileSync(src, dest);
  const record = await processComplaintFile(dest, store, { skipHttp: true });
  console.log(`Processed ${file} → ${record.classification.category} (${record.ticket_ref})`);
}

console.log(`Total complaints: ${store.listComplaints().length}`);
