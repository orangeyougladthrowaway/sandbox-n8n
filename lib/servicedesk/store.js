import fs from 'node:fs';
import path from 'node:path';
import { assertWritePathUnderDataRoot } from '../core/sandbox.js';

/**
 * File-backed store for service desk tickets.
 */
export class FileServiceDeskStore {
  /**
   * @param {string} dbFile
   */
  constructor(dbFile) {
    this.dbFile = dbFile;
    this.data = { tickets: [], events: [] };
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
   * @param {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket} ticket
   */
  upsertTicket(ticket) {
    const idx = this.data.tickets.findIndex((t) => t.id === ticket.id);
    if (idx >= 0) {
      this.data.tickets[idx] = ticket;
    } else {
      this.data.tickets.push(ticket);
    }
    this._save();
    return ticket;
  }

  /**
   * @param {string} id
   * @returns {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket|undefined}
   */
  getTicket(id) {
    return this.data.tickets.find((t) => t.id === id || t.external_ref === id);
  }

  /** @returns {import('../schemas/servicedesk-ticket.js').ServiceDeskTicket[]} */
  listTickets() {
    return [...this.data.tickets];
  }

  /**
   * @param {string} ticketId
   * @param {string} eventType
   * @param {object} [detail]
   */
  appendEvent(ticketId, eventType, detail = {}) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ticket_id: ticketId,
      event_type: eventType,
      detail,
      created_at: new Date().toISOString(),
    };
    this.data.events.push(event);
    this._save();
    return event;
  }

  reset() {
    this.data = { tickets: [], events: [] };
    this._save();
  }
}
