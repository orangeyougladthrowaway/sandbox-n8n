import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, SMOKE_ROOT, WORKFLOWS_DIR } from '../core/paths.js';

const N8N_SMOKE_ROOT = path.join(SMOKE_ROOT, 'n8n');
const USER_FOLDER = path.join(N8N_SMOKE_ROOT, 'user');
const DATA_FOLDER = path.join(N8N_SMOKE_ROOT, 'data');

/** Per-workflow output checks — mirrors vault success criteria. */
export const WORKFLOW_ASSERTIONS = {
  'Shared Create Ticket': (json) => Boolean(json.ticket_ref),
  'Shared KB Search': (json) => Array.isArray(json.items) && json.items.length > 0,
  'Shared Call AI Sim': (json) => json.classification?.category === 'dsar',
  'Shared Send Notification': (json) => typeof json.path === 'string' && json.path.includes('outbound'),
  'Shared Log Lifecycle Event': (json) => Boolean(json.message && json.level),
  'Complaints Classify': (json) => json.classification?.category === 'dsar',
  'Complaints Route': (json) => Boolean(json.ticket_ref || json.status),
  'Complaints Notify Customer': (json) => Boolean(json.id || json.thread_id),
  'Complaints Monitor Replies': (json) => Boolean(json.status),
  'Complaints Intake': (json) => Boolean(json.id && json.classification),
  'SD Queue Poller': (json) => json !== null && typeof json === 'object',
  'SD Intake': (json) => Boolean(json.id && json.lifecycle_events),
  'SD Classify Triage': (json) => Array.isArray(json.kb_matches) && json.kb_matches.length > 0,
  'SD Bot Reply': (json) => json.status === 'awaiting_user',
  'SD Await User': (json) =>
    Array.isArray(json.conversation) && json.conversation.some((t) => t.actor === 'user'),
  'SD Handoff Technician': (json) => json.status === 'with_technician',
  'SD Existing Ticket Refresh': (json) => Array.isArray(json.kb_matches),
  'DC Schedule Run': (json) => json.rows?.[0]?.id === 'exc_001',
  'DC Triage Exception': (json) => Boolean(json.ticket?.ticket_ref),
  'DC Cursor Bundle': (json) => typeof json.bundle_dir === 'string',
  'DO Schedule Run': (json) => json.rows?.some((r) => r.id === 'ops_001'),
  'DO Route Owners': (json) => typeof json.file === 'string' && json.file.includes('teams'),
};

export function isN8nCliAvailable() {
  const result = spawnSync('n8n', ['--version'], {
    encoding: 'utf8',
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return result.status === 0;
}

function n8nCodeEnv(overrides = {}) {
  return {
    ...process.env,
    N8N_RUNNERS_ENABLED: 'false',
    N8N_DIAGNOSTICS_ENABLED: 'false',
    NODE_FUNCTION_ALLOW_BUILTIN: 'path,fs,url,module',
    NODE_FUNCTION_ALLOW_EXTERNAL: 'module',
    ...overrides,
  };
}

function n8nSmokeEnv() {
  return n8nCodeEnv({
    N8N_USER_FOLDER: USER_FOLDER,
    N8N_REPO_ROOT: REPO_ROOT,
    N8N_DATA_ROOT: DATA_FOLDER,
  });
}

function runN8n(args, timeoutMs = 120_000, env = n8nSmokeEnv()) {
  const result = spawnSync('n8n', args, {
    env,
    encoding: 'utf8',
    cwd: REPO_ROOT,
    shell: true,
    timeout: timeoutMs,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  if (result.error) {
    throw new Error(`n8n ${args.join(' ')} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`n8n ${args.join(' ')} exited ${result.status}\n${stderr}\n${stdout}`);
  }
  return { stdout, stderr };
}

function parseExecuteJson(stdout) {
  const start = stdout.indexOf('{');
  if (start < 0) {
    throw new Error(`No JSON in n8n execute output:\n${stdout}`);
  }
  return JSON.parse(stdout.slice(start));
}

function extractLastNodeJson(execution) {
  const resultData = execution.data?.resultData;
  if (!resultData?.runData) {
    throw new Error('Missing resultData.runData in execution output');
  }
  const lastNode = resultData.lastNodeExecuted;
  const nodeRun = resultData.runData[lastNode]?.[0];
  if (!nodeRun || nodeRun.executionStatus !== 'success') {
    throw new Error(`Node "${lastNode}" did not succeed`);
  }
  return nodeRun.data.main[0][0].json;
}

function listWorkflowIds() {
  const { stdout } = runN8n(['list:workflow'], 60_000);
  const rows = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('|'));
  return rows.map((line) => {
    const [id, name] = line.split('|');
    return { id: id.trim(), name: name.trim() };
  });
}

function wipeSmokeTree() {
  if (fs.existsSync(N8N_SMOKE_ROOT)) {
    fs.rmSync(N8N_SMOKE_ROOT, { recursive: true, force: true });
  }
}

/** n8n --separate only reads JSON files in a single directory (no subfolders). */
export function flattenWorkflowsForImport(destDir) {
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  function walk(dir, prefix = '') {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        walk(full, prefix ? `${prefix}__${name}` : name);
      } else if (name.endsWith('.json')) {
        const flatName = prefix ? `${prefix}__${name}` : name;
        fs.copyFileSync(full, path.join(destDir, flatName));
      }
    }
  }

  walk(WORKFLOWS_DIR);
}

function importRepoWorkflows(timeoutMs = 180_000) {
  const importDir = path.join(N8N_SMOKE_ROOT, 'import-flat');
  flattenWorkflowsForImport(importDir);
  runN8n(['import:workflow', '--separate', `--input=${importDir}`], timeoutMs);
}

export function importRepoWorkflowsToLocalN8n(options = {}) {
  if (!isN8nCliAvailable()) {
    throw new Error('n8n CLI not found. Install: npm install -g n8n@1.80.0');
  }
  const stagingRoot = options.stagingRoot ?? path.join(SMOKE_ROOT, 'import-staging');
  const importDir = path.join(stagingRoot, 'flat');
  flattenWorkflowsForImport(importDir);
  const result = spawnSync(
    'n8n',
    ['import:workflow', '--separate', `--input=${importDir}`],
    {
      env: n8nCodeEnv(options.userFolder ? { N8N_USER_FOLDER: options.userFolder } : {}),
      encoding: 'utf8',
      cwd: REPO_ROOT,
      shell: true,
      timeout: 180_000,
    },
  );
  if (result.status !== 0) {
    throw new Error(`n8n import failed:\n${result.stderr}\n${result.stdout}`);
  }
  if (fs.existsSync(stagingRoot)) {
    fs.rmSync(stagingRoot, { recursive: true, force: true });
  }
  return (result.stdout ?? '').match(/Successfully imported (\d+) workflow/)?.[1] ?? '?';
}

function prepareSmokeTree() {
  wipeSmokeTree();
  fs.mkdirSync(path.join(DATA_FOLDER, '_runtime'), { recursive: true });
  fs.mkdirSync(path.join(DATA_FOLDER, 'outbound', 'sent'), { recursive: true });
  fs.mkdirSync(path.join(DATA_FOLDER, 'outbound', 'teams'), { recursive: true });
  fs.mkdirSync(path.join(DATA_FOLDER, 'outbound', 'servicedesk', 'chat'), { recursive: true });
  fs.mkdirSync(path.join(DATA_FOLDER, 'cursor-requests'), { recursive: true });
  fs.mkdirSync(path.join(DATA_FOLDER, 'inbound', 'mailbox', 'replies'), { recursive: true });
  fs.mkdirSync(path.join(DATA_FOLDER, 'inbound', 'servicedesk', 'chat'), { recursive: true });
}

/**
 * Import repo workflows and execute each via n8n CLI in an isolated user folder.
 * First run pays ~30–60s SQLite migration cost on fresh N8N_USER_FOLDER.
 */
export async function runN8nWorkflowSmokes(options = {}) {
  if (!isN8nCliAvailable()) {
    return { skipped: true, reason: 'n8n CLI not installed' };
  }

  const { keepArtifacts = false, verbose = false } = options;

  prepareSmokeTree();

  if (verbose) {
    console.log('Importing workflows (first run may take ~60s for n8n DB migrations)...');
  }
  importRepoWorkflows(180_000);

  const workflows = listWorkflowIds();
  if (workflows.length === 0) {
    throw new Error('No workflows imported');
  }

  const results = [];
  for (const { id, name } of workflows) {
    if (verbose) {
      console.log(`Execute: ${name} (${id})`);
    }
    const { stdout } = runN8n(['execute', `--id=${id}`, '--rawOutput'], 90_000);
    const execution = parseExecuteJson(stdout);
    if (!execution.finished) {
      throw new Error(`Workflow "${name}" did not finish`);
    }
    const json = extractLastNodeJson(execution);
    const assertFn = WORKFLOW_ASSERTIONS[name];
    if (assertFn && !assertFn(json)) {
      throw new Error(`Assertion failed for "${name}": ${JSON.stringify(json).slice(0, 200)}`);
    }
    results.push({ name, id, ok: true });
  }

  if (!keepArtifacts) {
    wipeSmokeTree();
  }

  return { skipped: false, passed: results.length, workflows: results };
}
