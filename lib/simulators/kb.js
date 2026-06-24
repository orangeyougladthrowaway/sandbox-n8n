import fs from 'node:fs';
import path from 'node:path';
import { getJson } from '../core/http.js';
import { FIXTURES_DIR } from '../core/paths.js';
import { defaultSkipHttp } from '../core/sandbox.js';

/**
 * Search KB via mock API or local fixtures.
 * @param {string} query
 * @param {{ skipHttp?: boolean }} [options]
 * @returns {Promise<{ doc_id: string, title: string, excerpt: string, score: number }[]>}
 */
export async function searchKb(query, options = {}) {
  const skipHttp = defaultSkipHttp(options.skipHttp);
  if (!skipHttp) {
    try {
      const result = await getJson(`/kb/search?q=${encodeURIComponent(query)}`);
      return result.items ?? [];
    } catch {
      // fall through to fixture search
    }
  }
  return searchKbFixtures(query);
}

/**
 * Search fixture KB markdown files in-process.
 * @param {string} query
 * @returns {{ doc_id: string, title: string, excerpt: string, score: number }[]}
 */
export function searchKbFixtures(query) {
  const kbDir = path.join(FIXTURES_DIR, 'servicedesk', 'kb');
  if (!fs.existsSync(kbDir)) {
    return [];
  }
  const raw = (query || '').trim();
  const terms = raw.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (raw && terms.length === 0) {
    return [];
  }
  const results = [];
  for (const file of fs.readdirSync(kbDir).filter((f) => f.endsWith('.md'))) {
    const content = fs.readFileSync(path.join(kbDir, file), 'utf8');
    const titleMatch = content.match(/^#\s+(.+)/m);
    const title = titleMatch ? titleMatch[1].trim() : file.replace(/\.md$/, '');
    const lower = content.toLowerCase();
    const titleLower = title.toLowerCase();
    const matchedTerms = terms.filter((t) => lower.includes(t) || titleLower.includes(t));
    if (terms.length === 0 || matchedTerms.length > 0) {
      results.push({
        doc_id: file.replace(/\.md$/, ''),
        title,
        excerpt: content.slice(0, 200).replace(/\n/g, ' '),
        score: matchedTerms.length / Math.max(terms.length, 1),
      });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}
