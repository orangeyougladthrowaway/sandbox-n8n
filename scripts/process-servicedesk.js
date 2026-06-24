import { runQueuePoller } from '../lib/servicedesk/pipeline.js';
import { FileServiceDeskStore } from '../lib/servicedesk/store.js';
import path from 'node:path';

const dataRoot = process.env.N8N_DATA_ROOT ?? 'C:/sandbox-dir/sandbox-n8n';
const dbFile = path.join(dataRoot, '_runtime', 'servicedesk-db.json');
const store = new FileServiceDeskStore(dbFile);
const result = await runQueuePoller(store, { skipHttp: true });
console.log(result ? `Processed ticket ${result.id} → ${result.status}` : 'No tickets in queue');
