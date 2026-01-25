-- Cleanup legacy demo keys that were multi-use
DELETE FROM registration_keys WHERE key IN ('J1-DEMO-001', 'J2-DEMO-002', 'J3-DEMO-003');
