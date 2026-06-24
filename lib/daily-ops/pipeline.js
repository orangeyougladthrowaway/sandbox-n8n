import fs from 'node:fs';
import path from 'node:path';
import { SMOKE_ROOT } from '../core/paths.js';
import { runOpsQuery, triageOpsTask, writeTeamsNotification } from './triage.js';

/**
 * @returns {string}
 */
export function dailyOpsSmokeRoot() {
  return path.join(SMOKE_ROOT, 'daily-ops');
}

/**
 * @returns {Promise<{ passed: number, scenarios: object[] }>}
 */
export async function runDailyOpsSmoke() {
  const root = dailyOpsSmokeRoot();
  fs.rmSync(root, { recursive: true, force: true });
  const teamsOut = path.join(root, 'outbound', 'teams');
  fs.mkdirSync(teamsOut, { recursive: true });

  const scenarios = [];
  const openTasks = [];

  for (const q of ['open-incidents', 'pending-changes']) {
    const result = runOpsQuery(q);
    for (const row of result.rows) {
      const { route, duplicate } = triageOpsTask(row, openTasks);
      if (!duplicate) {
        openTasks.push({ source_ref: row.id });
        const file = writeTeamsNotification(row, route, teamsOut);
        scenarios.push({
          name: `${q}-${row.id}`,
          file,
          ok: fs.existsSync(file),
        });
      } else {
        scenarios.push({ name: `${q}-${row.id}-dup`, ok: true });
      }
    }
  }

  fs.rmSync(root, { recursive: true, force: true });
  return { passed: scenarios.filter((s) => s.ok).length, scenarios };
}
