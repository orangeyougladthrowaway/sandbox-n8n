import { importRepoWorkflowsToLocalN8n, isN8nCliAvailable } from '../lib/test/n8nSmokeHarness.js';

if (!isN8nCliAvailable()) {
  console.error('n8n CLI not found. Install: npm install -g n8n@1.80.0');
  process.exit(1);
}

const count = importRepoWorkflowsToLocalN8n();
console.log(`Workflows imported into local n8n (${count} files).`);
