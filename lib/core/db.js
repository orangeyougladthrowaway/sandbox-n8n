import fs from 'node:fs';
import path from 'node:path';
import { assertWritePathUnderDataRoot } from './sandbox.js';

/**
 * File-backed store for complaint records and lifecycle events (no external DB).
 */
export class FileComplaintStore {
  /**
   * @param {string} dbFile - Path to JSON store file.
   */
  constructor(dbFile) {
    this.dbFile = dbFile;
    this.data = { complaints: [], events: [] };
    this._load();
  }

  _load() {
    if (fs.existsSync(this.dbFile)) {
      this.data = JSON.parse(fs.readFileSync(this.dbFile, 'utf8'));
    }
  }

  _save() {
    assertWritePathUnderDataRoot(this.dbFile);
    fs.mkdirSync(path.dirname(this.dbFile), { recursive: true });
    fs.writeFileSync(this.dbFile, JSON.stringify(this.data, null, 2), 'utf8');
  }

  /**
   * Insert or replace a complaint record.
   * @param {import('../schemas/complaint.js').ComplaintRecord} record
   */
  upsertComplaint(record) {
    const idx = this.data.complaints.findIndex((c) => c.id === record.id);
    if (idx >= 0) {
      this.data.complaints[idx] = record;
    } else {
      this.data.complaints.push(record);
    }
    this._save();
    return record;
  }

  /**
   * @param {string} id
   * @returns {import('../schemas/complaint.js').ComplaintRecord|undefined}
   */
  getComplaint(id) {
    return this.data.complaints.find((c) => c.id === id);
  }

  /**
   * @param {string} threadId
   * @returns {import('../schemas/complaint.js').ComplaintRecord|undefined}
   */
  findByThreadId(threadId) {
    return this.data.complaints.find((c) => c.thread_id === threadId);
  }

  /**
   * Append complaint event row.
   * @param {string} complaintId
   * @param {string} eventType
   * @param {object} [detail]
   */
  appendEvent(complaintId, eventType, detail = {}) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      complaint_id: complaintId,
      event_type: eventType,
      detail,
      created_at: new Date().toISOString(),
    };
    this.data.events.push(event);
    this._save();
    return event;
  }

  /** @returns {import('../schemas/complaint.js').ComplaintRecord[]} */
  listComplaints() {
    return [...this.data.complaints];
  }

  /** @returns {object[]} */
  listEvents(complaintId) {
    return this.data.events.filter((e) => e.complaint_id === complaintId);
  }

  reset() {
    this.data = { complaints: [], events: [] };
    this._save();
  }
}
