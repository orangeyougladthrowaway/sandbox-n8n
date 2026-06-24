import { postJson } from '../core/http.js';

/**
 * Post complaint to mock CRM API.
 * @param {object} payload
 * @returns {Promise<{ crm_ref: string }>}
 */
export async function syncComplaintToCrm(payload) {
  const result = await postJson('/crm/complaints', payload);
  return { crm_ref: result.crm_ref };
}
