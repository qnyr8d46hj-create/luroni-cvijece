# Artificial catalog — safe production deploy and rollback

Known-good production git commit before this work: `5c06294` (`Update bouquet pricing and feature Bouquet L`).

Do **not** deploy Firestore Security Rules. Do **not** set `ARTIFICIAL_CHECKOUT_ENABLED=true` until manual checkout testing is approved.

## Production env (names only)

Required already for live fresh checkout:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Firebase Admin (`FIREBASE_PROJECT_ID` / service-account JSON fields used by `lib/firebaseAdmin.ts`)
- `RESEND_API_KEY`
- `ORDER_NOTIFICATION_EMAIL`

New for this deploy:

- Leave `ARTIFICIAL_CHECKOUT_ENABLED` **unset** (or `false`). Checkout stays closed.
- Do **not** set `RESEND_DOMAIN_VERIFIED=true` unless luroni.hr is verified in Resend.

Optional later (artificial email retry only): `EMAIL_RETRY_SECRET` or `CRON_SECRET`.

## Deploy app (after approval)

1. Confirm `ARTIFICIAL_CHECKOUT_ENABLED` is unset/false in Vercel Production.
2. Confirm you are **not** running `firebase deploy --only firestore:rules`.
3. Commit/push only after explicit approval, then let Vercel deploy `main`.
4. Smoke-test fresh checkout (card + cash) on https://www.luroni-cvijece.com/
5. Open `/umjetni-cvjetni-aranzmani` — 17 products and prices visible, Naruči disabled.
6. Confirm `POST /api/create-artificial-order` returns 503.

## Enable artificial checkout later (separate approval)

1. Set Vercel Production `ARTIFICIAL_CHECKOUT_ENABLED=true`.
2. Redeploy (env changes do not apply to the already-running deployment until rebuild).
3. Manually test one cash and one Stripe test/live order before announcing purchase.

## Rollback (Vercel)

Fastest: promote the previous Production deployment, do not git-revert blindly if later commits exist.

### Dashboard

1. Vercel → project `luroni-cvijece` → **Deployments**.
2. Find the last Production deployment whose git SHA is `5c06294` (or the deployment that was Production immediately before this catalog deploy).
3. ⋯ → **Promote to Production** (or Instant Rollback).
4. Confirm https://www.luroni-cvijece.com/ homepage order form still works.
5. Confirm `/umjetni-cvjetni-aranzmani` 404s again after rollback (page was not in `5c06294`).

### CLI

```bash
npx vercel rollback
```

Choose the deployment tied to `5c06294`. Do not pass `--force` unless Vercel requires confirmation for Production.

If Instant Rollback is unavailable, redeploy that git SHA:

```bash
git fetch origin
git checkout 5c06294
npx vercel deploy --prod --yes
```

Then check out `main` again locally. Do not `git push --force` to `main`.

Rollback does **not** change Firestore products in `artificial_bouquets`. That catalog data can stay; the public page simply disappears until a later deploy.

## After rollback

Fresh Stripe webhook URL stays `/api/stripe/webhook`. Do not rotate webhook secrets unless rollback fails signature verification.
