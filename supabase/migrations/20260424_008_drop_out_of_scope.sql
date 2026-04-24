-- Scope correction: agente-ads is strictly Meta Ads + Google Ads automation.
-- SDR (leads) and outreach (email sequences, meetings) belong to other products.
-- Cascade chosen intentionally — tables are empty, no data loss.

drop table if exists email_events cascade;
drop table if exists email_enrollments cascade;
drop table if exists email_sequences cascade;
drop table if exists meetings cascade;
drop table if exists lead_signals cascade;
drop table if exists leads cascade;
