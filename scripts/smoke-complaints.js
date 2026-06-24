import { runComplaintsSmoke } from '../lib/complaints/pipeline.js';

try {
  const result = await runComplaintsSmoke();
  console.log(`Complaints smoke OK: ${result.passed} scenarios passed`);
  for (const scenario of result.scenarios) {
    console.log(`  ✓ ${scenario.name} → ${JSON.stringify(scenario)}`);
  }
} catch (error) {
  console.error('Complaints smoke FAILED:', error.message);
  process.exit(1);
}
