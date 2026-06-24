-- Daily check: null required fields
SELECT id, severity, message, source
FROM data_quality.required_field_violations
WHERE field_name = 'customer_id' AND value IS NULL;
