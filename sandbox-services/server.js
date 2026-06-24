import express from 'express';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const port = Number(process.env.MOCK_API_PORT || 3099);
const repoRoot = process.env.N8N_REPO_ROOT?.trim() || path.resolve(__dirname, '..');
const kbDir = path.join(repoRoot, 'fixtures', 'servicedesk', 'kb');

/** @type {object[]} */
const crmStore = [];
/** @type {object[]} */
const ticketStore = [];

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function priorityRank(priority) {
  return PRIORITY_ORDER[priority] ?? 99;
}

function sortTickets(items, sort) {
  const list = [...items];
  if (sort === 'priority') {
    list.sort((a, b) => {
      const pr = priorityRank(a.priority) - priorityRank(b.priority);
      if (pr !== 0) return pr;
      return String(a.created_at).localeCompare(String(b.created_at));
    });
  }
  return list;
}

function filterTickets(query) {
  let items = [...ticketStore];
  if (query.assignee) {
    items = items.filter((t) => t.assignee === query.assignee);
  }
  if (query.status) {
    const statuses = String(query.status).split(',');
    items = items.filter((t) => statuses.includes(t.status));
  }
  if (query.source_program) {
    items = items.filter((t) => t.source_program === query.source_program);
  }
  if (query.since) {
    items = items.filter((t) => t.updated_at >= query.since);
  }
  return sortTickets(items, query.sort || 'priority');
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sandbox-mock-api', tickets: ticketStore.length });
});

app.post('/ai/analyze', (req, res) => {
  const text = (req.body?.text || '').toLowerCase();
  let category = 'support';
  let actions = ['SUPPORT_ONLY'];
  if (text.includes('dsar') || text.includes('subject access')) {
    category = 'dsar';
    actions = ['DSAR'];
  } else if (text.includes('compliance') || text.includes('fca')) {
    category = 'compliance';
    actions = ['COMPLIANCE'];
  }
  res.json({
    classification: { category, confidence: 0.8, rationale: 'mock-api keyword rules' },
    sentiment: { score: -0.3, label: 'concerned' },
    requested_actions: actions,
  });
});

app.post('/ai/servicedesk', (req, res) => {
  const text = (req.body?.text || '').toLowerCase();
  let category = 'request';
  if (text.includes('vpn') || text.includes('network') || text.includes('connect')) {
    category = 'incident';
  } else if (text.includes('password') || text.includes('reset')) {
    category = 'request';
  }
  res.json({
    classification: {
      category,
      confidence: 0.82,
      rationale: 'mock-api servicedesk keyword rules',
    },
  });
});

app.post('/crm/complaints', (req, res) => {
  const crm_ref = `CRM-${randomUUID().slice(0, 8)}`;
  const record = { crm_ref, payload: req.body, at: new Date().toISOString() };
  crmStore.push(record);
  res.status(201).json({ crm_ref });
});

app.get('/crm/complaints', (_req, res) => {
  res.json({ items: crmStore });
});

app.get('/tickets', (req, res) => {
  res.json({ items: filterTickets(req.query) });
});

app.get('/tickets/:id', (req, res) => {
  const ticket = ticketStore.find((t) => t.id === req.params.id || t.ticket_ref === req.params.id);
  if (!ticket) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  res.json(ticket);
});

app.post('/tickets', (req, res) => {
  const now = new Date().toISOString();
  const ticket_ref = `TKT-${randomUUID().slice(0, 8)}`;
  const ticket = {
    id: randomUUID(),
    ticket_ref,
    title: req.body.title,
    description: req.body.description,
    priority: req.body.priority || 'medium',
    status: req.body.status || 'new',
    source_program: req.body.source_program || 'servicedesk',
    source_ref: req.body.source_ref || ticket_ref,
    owner_team: req.body.owner_team || 'support-team',
    assignee: req.body.assignee ?? null,
    metadata: req.body.metadata || {},
    comments: [],
    created_at: now,
    updated_at: now,
  };
  ticketStore.push(ticket);
  res.status(201).json(ticket);
});

app.patch('/tickets/:id', (req, res) => {
  const idx = ticketStore.findIndex(
    (t) => t.id === req.params.id || t.ticket_ref === req.params.id,
  );
  if (idx < 0) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  const allowed = [
    'status',
    'priority',
    'assignee',
    'owner_team',
    'title',
    'description',
    'metadata',
  ];
  const patch = { ...ticketStore[idx] };
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      patch[key] = req.body[key];
    }
  }
  patch.updated_at = new Date().toISOString();
  ticketStore[idx] = patch;
  res.json(patch);
});

app.post('/tickets/:id/comments', (req, res) => {
  const ticket = ticketStore.find(
    (t) => t.id === req.params.id || t.ticket_ref === req.params.id,
  );
  if (!ticket) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  const comment = {
    id: randomUUID(),
    author: req.body.author || 'system',
    text: req.body.text || '',
    at: new Date().toISOString(),
  };
  ticket.comments.push(comment);
  ticket.updated_at = comment.at;
  res.status(201).json(comment);
});

app.get('/kb/search', (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  const terms = q.split(/\s+/).filter((t) => t.length > 2);
  const results = [];
  if (fs.existsSync(kbDir)) {
    for (const file of fs.readdirSync(kbDir).filter((f) => f.endsWith('.md'))) {
      const content = fs.readFileSync(path.join(kbDir, file), 'utf8');
      const titleMatch = content.match(/^#\s+(.+)/m);
      const title = titleMatch ? titleMatch[1].trim() : file.replace(/\.md$/, '');
      const lower = content.toLowerCase();
      const matched = terms.filter((t) => lower.includes(t) || title.toLowerCase().includes(t));
      if (terms.length === 0 || matched.length > 0) {
        results.push({
          doc_id: file.replace(/\.md$/, ''),
          title,
          excerpt: content.slice(0, 200).replace(/\n/g, ' '),
          score: matched.length / Math.max(terms.length, 1),
        });
      }
    }
  }
  results.sort((a, b) => b.score - a.score);
  res.json({ items: results.slice(0, 5) });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Mock API listening on 127.0.0.1:${port}`);
});
