-- 0001_purge_synthetic_snapshots.sql
--
-- Removes fabricated history written by the pre-honesty pipeline:
--   * historical backfill rows that copied TODAY's forks/open_issues into
--     past dates and stored contributors = 0 (never observed);
--   * star counts synthesized by the decay fallback (indistinguishable in
--     SQL — they age out of the 7d/30d windows on their own; the 90d window
--     clears fully 90 days after deploy).
--
-- STRATEGY: downgrade, don't destroy. Unobserved fields are set back to
-- NULL ("unknown") instead of deleting rows, so star observations survive.
-- Technology scores are deleted wholesale: every batch was computed with
-- the wrong status thresholds and clamped deltas, and they are fully
-- recalculable from snapshots. Regenerate insights afterwards (the newest
-- honest insight supersedes old ones automatically).
--
-- RUNBOOK (production):
--   1. Backup first:  pg_dump $DATABASE_URL -t repository_snapshots \
--                       -t technology_scores > /tmp/pre001_backup.sql
--   2. Run STEP 0 below, inspect the counts. Proceed only if the flagged
--      share looks like backfill volume (small % of total rows).
--   3. Run STEP 1 + STEP 2 inside one transaction.
--   4. Recalculate: POST /api/radar/calculate (admin), then
--      POST /api/reports/generate-insight to supersede old AI content.
--   5. Verify: re-run STEP 0 — must return 0 rows.

-- ============ STEP 0 — inspect (read-only, run first) ============
-- Candidate synthetic rows: old snapshots whose contributors read exactly 0.
-- Genuine current-sync rows refresh every ~6h, so anything older than 6 days
-- with contributors = 0 is overwhelmingly backfill fiction (the new code
-- writes NULL, never 0, for unobserved counts).
SELECT count(*) AS synthetic_candidates,
       count(*) FILTER (WHERE forks IS NOT NULL) AS with_copied_forks,
       min(captured_at) AS oldest,
       max(captured_at) AS newest
FROM repository_snapshots
WHERE contributors = 0
  AND captured_at < NOW() - INTERVAL '6 days';

-- Distribution sanity: per-month breakdown of the candidates.
SELECT TO_CHAR(captured_at, 'YYYY-MM') AS month, count(*)
FROM repository_snapshots
WHERE contributors = 0
  AND captured_at < NOW() - INTERVAL '6 days'
GROUP BY 1 ORDER BY 1;

-- ============ STEP 1 — downgrade unobserved fields to NULL ============
-- (Run inside a transaction; check row count matches STEP 0.)
BEGIN;
UPDATE repository_snapshots
SET forks = NULL,
    open_issues = NULL,
    contributors = NULL
WHERE contributors = 0
  AND captured_at < NOW() - INTERVAL '6 days';
-- COMMIT;  -- uncomment to commit after verifying the count.

-- ============ STEP 2 — drop miscalculated radar batches ============
-- All batches predate the threshold fix; recalculation rebuilds them.
BEGIN;
DELETE FROM technology_scores;
-- COMMIT;  -- uncomment to commit.
