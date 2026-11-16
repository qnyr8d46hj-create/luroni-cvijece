// Production sets NN_PRICE_COMPLIANCE_ENABLED=true. Other environments leave
// it unset, so this stays false. Do not turn it on from the calendar date.
// The Vercel cron list cannot read this flag.
//
// Checked on the evening of 2026-11-16 (Europe/Zagreb) against
// https://narodne-novine.nn.hr/eli/sluzbeni/2026/132/pdf
// NN 132/2026, published 16 November 2026, takes effect 17 November 2026:
// - 1579 repeals the additional-price decision (NN 101/2026 and 110/2026)
// - 1580 repeals the price-list decision (NN 101/2026 and 110/2026)
// - 1583 Pravilnik o isticanju bazne cijene proizvoda
// - 1584 Pravilnik o načinu objave cjenika proizvoda
// Flowers are "ostala roba": the base price is the 10 September 2026 price.
// The CSV follows 1584 article 3(2). It has no dostupno/nedostupno column.
// A changed file is due by 11:00 Europe/Zagreb on the day it changes.
// The replaced file stays available for 15 days from replacement.
// The filename includes the OIB, the webshop outlet, "roba", the storage
// number, and a Zagreb timestamp GGGGMMDD_SSMM.
//
// Not treated as legally settled:
// - whether a made-to-order bouquet is physical stock under any rule that
//   still uses dostupno; this file does not state a stock status
// - the token "ne", and putting it in the column after the retail price
// - any gazette text published after NN 132/2026
//
// Cron, beside the gallery job: { "path": "/api/cron/publish-price-list", "schedule": "0 5 * * *" }
// Vercel cron is UTC. On Hobby the 05:00 hour can run until 05:59 UTC,
// which is 06:59 Europe/Zagreb in winter and 07:59 in summer, before 11:00.

export const NN_PRICE_COMPLIANCE_ENABLED =
  process.env.NN_PRICE_COMPLIANCE_ENABLED === 'true'
