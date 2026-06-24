-- Daily check: stale pipeline lag
SELECT id, severity, message, source
FROM monitoring.batch_lag
WHERE lag_hours > 4;
