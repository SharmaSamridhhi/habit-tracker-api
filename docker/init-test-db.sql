-- Runs once when the `db` container's data volume is first created.
-- Creates a second database used by the Jest test suite (see .env.test)
-- so tests never touch development data.
CREATE DATABASE habit_tracker_test;
