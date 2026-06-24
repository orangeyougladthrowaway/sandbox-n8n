INSERT INTO complaint_records (
  id, channel, received_at, normalized_text, classification, requested_actions, sentiment, status
) VALUES (
  'cmp_seed_demo',
  'mailbox',
  NOW(),
  'Seed complaint for demo queries',
  '{"category":"support","confidence":0.5,"rationale":"seed"}',
  '["SUPPORT_ONLY"]',
  '{"score":0,"label":"neutral"}',
  'closed'
) ON CONFLICT (id) DO NOTHING;
