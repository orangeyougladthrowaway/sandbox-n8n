import { runServiceDeskSmoke } from '../lib/servicedesk/pipeline.js';

try {
  const result = await runServiceDeskSmoke();
  console.log(`Service desk smoke OK: ${result.passed}/${result.scenarios.length} scenarios passed`);
  for (const scenario of result.scenarios) {
    console.log(`  ${scenario.ok ? '✓' : '✗'} ${scenario.name}`);
  }
  if (result.scenarios.some((s) => !s.ok)) {
    process.exit(1);
  }
} catch (error) {
  console.error('Service desk smoke FAILED:', error.message);
  process.exit(1);
}
