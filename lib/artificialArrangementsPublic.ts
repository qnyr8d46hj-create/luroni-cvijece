// Temporarily hidden while artificial arrangements are sold in person / via mobile.
// Product data, images, Firestore records, existing orders and checkout code are preserved.
//
// To restore:
// 1. Set ARTIFICIAL_ARRANGEMENTS_PUBLIC to true.
// 2. Redeploy. Leave ARTIFICIAL_CHECKOUT_ENABLED as currently configured.
// 3. Confirm the homepage teaser, footer link, catalog page and sitemap URL are visible.
// 4. Confirm POST /api/create-artificial-order only succeeds if ARTIFICIAL_CHECKOUT_ENABLED=true.

export const ARTIFICIAL_ARRANGEMENTS_PUBLIC = false

export const ARTIFICIAL_ARRANGEMENTS_UNAVAILABLE_NOTICE =
  'Naručivanje umjetnih aranžmana trenutačno nije dostupno putem web-stranice.'
