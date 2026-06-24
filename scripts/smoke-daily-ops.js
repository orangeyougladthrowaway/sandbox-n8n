import { runDailyOpsSmoke } from '../lib/daily-ops/pipeline.js';

try {
  const result = await runDailyOpsSmoke();
  console.log(`Daily ops smoke OK: ${result.passed}/${result.scenarios.length} scenarios passed`);
  for (const scenario of result.scenarios) {
    console.log(`  ✓ ${scenario.name}`);
  }
} catch (error) {
  console.error('Daily ops smoke FAILED:', error.message);
  process.exit(1);
}
