// Temporarily disabled after Croatian Government decision of 2026-09-29.
// Deadline extended from 2026-10-01 to 2026-11-17.
// Re-check final regulations before re-enabling.
//
// To restore (after reviewing the final rules):
// 1. Set NN_PRICE_COMPLIANCE_ENABLED to true.
// 2. Restore vercel.json crons to:
//    { "path": "/api/cron/publish-price-list", "schedule": "0 5 * * *" }
// 3. Confirm CRON_SECRET is set in Vercel Production.
// vercel.json cannot read this flag — the cron list must be restored separately.

export const NN_PRICE_COMPLIANCE_ENABLED = false
