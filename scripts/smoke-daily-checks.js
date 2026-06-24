import { runDailyChecksSmoke } from '../lib/daily-checks/pipeline.js';

try {
  const result = await runDailyChecksSmoke();
  console.log(`Daily checks smoke OK: ${result.passed}/${result.scenarios.length} scenarios passed`);
  for (const scenario of result.scenarios) {
    console.log(`  ✓ ${scenario.name}`);
  }
} catch (error) {
  console.error('Daily checks smoke FAILED:', error.message);
  process.exit(1);
}
