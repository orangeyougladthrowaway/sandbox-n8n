export {
  REPO_ROOT,
  DATA_ROOT,
  INBOUND_MAILBOX,
  INBOUND_MAILBOX_REPLIES,
  INBOUND_SCANS,
  INBOUND_TRANSCRIPTS,
  INBOUND_SERVICEDESK_CHAT,
  OUTBOUND_SENT,
  OUTBOUND_TEAMS,
  OUTBOUND_SERVICEDESK_CHAT,
  CURSOR_REQUESTS,
  SMOKE_ROOT,
  FIXTURES_DIR,
  PROMPTS_DIR,
  DB_SCHEMA_DIR,
  DB_SEEDS_DIR,
  DB_QUERIES_DIR,
  WORKFLOWS_DIR,
  DEFAULT_BOT_TECH_ID,
  libImportUrl,
  libModulePath,
} from './core/paths.js';

export { logEvent, newId } from './core/logging.js';
export {
  assertWritePathUnderDataRoot,
  assertAllowedHttpUrl,
  isMockApiEnabled,
  defaultSkipHttp,
} from './core/sandbox.js';
export { mockApiBaseUrl, postJson, getJson, patchJson } from './core/http.js';
export { FileComplaintStore } from './core/db.js';

export {
  createComplaintRecord,
  validateComplaintRecord,
  appendLifecycleEvent,
  REQUESTED_ACTIONS,
  LIFECYCLE_EVENT_TYPES,
  COMPLAINT_CHANNELS,
} from './schemas/complaint.js';
export {
  validateTicketPayload,
  createTicketPayload,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  SOURCE_PROGRAMS,
} from './schemas/ticket.js';
export {
  createServiceDeskTicket,
  validateServiceDeskTicket,
  appendLifecycleEvent as appendServiceDeskLifecycleEvent,
  SD_STATUSES,
} from './schemas/servicedesk-ticket.js';

export { analyzeText, summarizeException } from './simulators/aiClient.js';
export { syncComplaintToCrm } from './simulators/crm.js';
export {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  addTicketComment,
  pollTicketsForAssignee,
} from './simulators/ticketing.js';
export { searchKb, searchKbFixtures } from './simulators/kb.js';
export { sendSimulatedEmail, renderCustomerNotification } from './simulators/email.js';

export {
  parseEmlBody,
  parseTranscriptJson,
  detectChannel,
  normalizeInboundArtifact,
  fixtureIdFromPath,
  assertValidComplaint,
} from './complaints/normalize.js';
export { classifyComplaint } from './complaints/classify.js';
export { buildTicketPayload, routeComplaint } from './complaints/route.js';
export { notifyCustomer } from './complaints/notify.js';
export { processReply, extractThreadId } from './complaints/monitor.js';
export {
  processComplaintFile,
  processReplyFile,
  complaintsSmokeRoot,
  runComplaintsSmoke,
} from './complaints/pipeline.js';

export {
  normalizeTicketPayload,
  linkExternalTicket,
  validateServiceDeskTicket as validateSdIntake,
} from './servicedesk/intake.js';
export { classifyTicket } from './servicedesk/classify.js';
export { triageTicket, prioritySortKey } from './servicedesk/triage.js';
export { analyzeKb } from './servicedesk/kb.js';
export {
  appendConversationTurn,
  evaluateConversation,
  MAX_BOT_TURNS,
} from './servicedesk/conversation.js';
export {
  generateElicitationMessage,
  detectGaps,
  userRequestedHandoff,
} from './servicedesk/elicitation.js';
export { buildHandoffSummary, handoffToTechnician } from './servicedesk/handoff.js';
export { pollBotQueue, loadFixtureQueue, pickNextTicket } from './servicedesk/queue.js';
export { FileServiceDeskStore } from './servicedesk/store.js';
export {
  writeBotChatFile,
  readUserChatReply,
  processTicketCycle,
  runQueuePoller,
  serviceDeskSmokeRoot,
  runServiceDeskSmoke,
} from './servicedesk/pipeline.js';

export {
  loadQuery,
  runCheckQuery,
  triageException,
  createExceptionTicket,
} from './daily-checks/triage.js';
export { writeCursorBundle, newCheckRunId } from './daily-checks/cursorBundle.js';
export { dailyChecksSmokeRoot, runDailyChecksSmoke } from './daily-checks/pipeline.js';

export {
  loadOpsQuery,
  runOpsQuery,
  triageOpsTask,
  writeTeamsNotification,
} from './daily-ops/triage.js';
export { dailyOpsSmokeRoot, runDailyOpsSmoke } from './daily-ops/pipeline.js';
