# Clinical tool usage

Calculators, decision tools and checklists share the `calculators` catalog and
the same usage-session pipeline.

## What is recorded

The mobile `UseCalculatorController` starts a session after the published schema
has loaded and saved workflow state has been restored. It records the signed-in
user, tool ID, published version ID, tool type and UTC start time. Disposing the
tool page records the end time. These are tool opens and page closes, not proof
that a clinical assessment was completed. Inputs and calculation results are
not included in the usage payload. Dashboard authoring/test runs and guest use
do not start these sessions.

`CalculatorUsageTracker` persists sessions locally per user, then synchronizes
at startup, on sign-in/reconnection, and every minute. A stable idempotency key
survives retries. The backend creates the usage log and increments `usage_count`
in one transaction; replaying a start does not increment the counter again.
Session ends can only be written by the owning user. Offline records retain the
version that was actually used, even when a newer version is published.

## Dashboard statistics

`GET /api/v2/calculators/{id}/usage` requires `analytics.read` or `admin.all`.
The Usage tab on each tool displays:

- Lifetime synced sessions, distinct users and sessions with an end timestamp.
- Sessions during the last 30 UTC calendar days, including today.
- A daily series with zero-count days included.

Statistics are derived from non-deleted usage logs for that tool across all
versions, rather than from the mutable catalog counter. Historical logs are
included immediately; no events can be reconstructed for untracked usage.
An application crash or forced termination may leave a session without an end.
Offline events only appear after successful synchronization. User account
deletion can remove associated records through the existing foreign keys.

Migration `00087_calculator_usage_analytics.sql` adds an index for tool/date
queries. Apply migrations before deploying the updated API and dashboard.
