-- Daily ops: open incidents
SELECT id, title, owner_team, priority
FROM ops.open_incidents
WHERE status = 'open';
