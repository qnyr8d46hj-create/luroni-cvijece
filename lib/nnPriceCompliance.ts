// Kept off until activation is explicitly approved.
// Do not turn this on because the calendar reached 2026-11-17.
//
// Checked on 2026-11-16 (Europe/Zagreb):
// - NN 59/2026 puts "bazna cijena" in the Consumer Protection Act.
//   Those articles apply from 2026-11-17.
// - NN 101/2026 decisions 1212 and 1213 require the regular price from
//   2026-09-10, shown beside the current price, plus a public CSV or XML
//   price list, a product update by 08:00 Europe/Zagreb, a service-price
//   update by 08:00 on the day it changes, a 30-day archive, and machine
//   retrieval. Flowers are not in the 2025-05-02 food and household group.
// - NN 110/2026 only replaces 1 October 2026 with 17 November 2026.
// - On 2026-11-14 the Government adopted the two implementing pravilnici
//   and decisions repealing the NN 101/2026 measures. Those texts were not
//   in Narodne novine on 2026-11-16. The October drafts are not the schema.
//
// Publication stays blocked until lib/priceListOutlet.ts has a confirmed
// outlet and the availability word is confirmed. Do not invent either.
// Do not add the price-list cron, and do not remove the gallery cron, until
// those blockers are clear and CRON_SECRET is set in Vercel Production.
// vercel.json cannot read this flag.
//
// Schedule to add beside the existing gallery job, once publication is allowed:
// { "path": "/api/cron/publish-price-list", "schedule": "0 5 * * *" }
// Vercel cron is UTC. On Hobby the 05:00 hour can run until 05:59 UTC,
// which is 06:59 Europe/Zagreb in winter and 07:59 in summer, before 08:00.

export const NN_PRICE_COMPLIANCE_ENABLED = false
