-- Daily ops: pending changes
SELECT id, title, owner_team, priority
FROM ops.pending_changes
WHERE due_within_days <= 7;
