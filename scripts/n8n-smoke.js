import { isN8nCliAvailable, runN8nWorkflowSmokes } from '../lib/test/n8nSmokeHarness.js';

if (!isN8nCliAvailable()) {
  console.log('SKIP: n8n CLI not found (npm install -g n8n@1.80.0)');
  process.exit(0);
}

try {
  const result = await runN8nWorkflowSmokes({ verbose: true });
  if (result.skipped) {
    console.log(`SKIP: ${result.reason}`);
    process.exit(0);
  }
  console.log(`n8n workflow smoke OK: ${result.passed} workflows executed`);
  for (const wf of result.workflows) {
    console.log(`  ✓ ${wf.name}`);
  }
} catch (error) {
  console.error('n8n workflow smoke FAILED:', error.message);
  process.exit(1);
}
