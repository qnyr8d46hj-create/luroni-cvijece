// ── Firebase Admin SDK — server-side only ─────────────────────
//
// Use this module in server-side code (API routes, webhook handlers).
// NEVER import it in client components or anything under 'use client'.
//
// Required environment variables (add all three to Vercel → Settings → Env vars):
//   FIREBASE_PROJECT_ID    — e.g. "luroni-cvijece"
//   FIREBASE_CLIENT_EMAIL  — e.g. "firebase-adminsdk-xxxxx@luroni-cvijece.iam.gserviceaccount.com"
//   FIREBASE_PRIVATE_KEY   — the full RSA private key from the service account JSON,
//                            including BEGIN/END lines, with \n for line breaks
//
// How to get these values:
//   Firebase Console → Project Settings → Service Accounts → Generate new private key
//   Download the JSON and copy the three fields listed above.
//
// PRIVATE KEY FORMAT in .env.local:
//   FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n"
//   The .replace(/\\n/g, '\n') below handles the escaped newlines that
//   dotenv stores for local dev. On Vercel the real newlines are preserved.

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, FieldValue }                from 'firebase-admin/firestore'

// ── Singleton initialisation — safe under Next.js hot reload ──
function getAdminApp(): App {
  const existing = getApps()
  if (existing.length > 0) return existing[0]

  const projectId   = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      '[firebaseAdmin] Missing env vars — set FIREBASE_PROJECT_ID, ' +
      'FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your environment.',
    )
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // dotenv stores \n as a two-character literal escape sequence.
      // Vercel stores real newline characters. Handle both.
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  })
}

export const adminDb = getFirestore(getAdminApp())
export { FieldValue }
