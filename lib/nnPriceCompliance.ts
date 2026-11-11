// Kept off until activation is explicitly approved.
// NN 110/2026 moved the start date from 2026-10-01 to 2026-11-17.
// Final implementing regulations were still unpublished on 2026-11-11.
//
// Publication is also blocked until lib/priceListOutlet.ts has a confirmed
// outlet and the availability meaning is confirmed. Do not invent either.
// Do not restore the cron before those blockers are clear and CRON_SECRET
// is set in Vercel Production. vercel.json cannot read this flag.
//
// Schedule to restore once publication is allowed:
// { "path": "/api/cron/publish-price-list", "schedule": "0 5 * * *" }
// Vercel cron is UTC. On Hobby the 05:00 hour can run until 05:59 UTC,
// which is 06:59 Europe/Zagreb in winter and 07:59 in summer, before 08:00.

export const NN_PRICE_COMPLIANCE_ENABLED = false
