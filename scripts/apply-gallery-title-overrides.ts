// Local, one-time titles for the ten approved gallery posts.
// Dry-run is the default and writes nothing. A write needs the exact
// confirmation phrase and updates only metadataOverride.title.
// This file does not call Google, does not sync the gallery, and does not
// accept Firebase credentials as arguments.

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { APPROVED_GALLERY_TITLES } from '../lib/gbpGallery/approvedTitles'
import { galleryMetadata } from '../lib/gbpGallery/metadata'
import { docIdFromResourceName } from '../lib/gbpGallery/model'

export const CONFIRM_PHRASE = 'APPLY_APPROVED_TITLES'
const COLLECTION = 'gbpGalleryPosts'
const TITLE_FIELD = 'metadataOverride.title'
const ADMIN_ENV = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'] as const

export function titleFieldUpdate(title: string): Record<typeof TITLE_FIELD, string> {
  return { [TITLE_FIELD]: title }
}

export function writeConfirmed(argv: string[]): boolean {
  const confirmAt = argv.indexOf('--confirm')
  return confirmAt >= 0 && argv[confirmAt + 1] === CONFIRM_PHRASE
}

type RawRecord = Record<string, unknown>

export interface TitleCheck {
  id: string
  exists: boolean
  postIdMatches: boolean
  generatedTitle: string | null
  storedTitle: string | null
  approvedTitle: string
  otherOverrideFields: string[]
  overrideShape: 'missing' | 'null' | 'map' | 'invalid'
  safe: boolean
}

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

function parseArgs(argv: string[]): { help: boolean; write: boolean } {
  if (/BEGIN |PRIVATE KEY|FIREBASE_PRIVATE_KEY=/.test(argv.join(' '))) {
    fail('Refusing to read credentials from the command line.')
  }
  const help = argv.includes('--help')
  const positional = argv.filter((arg) => arg !== CONFIRM_PHRASE && !arg.startsWith('--'))
  const unknown = argv.filter((arg) => arg.startsWith('--') && arg !== '--help' && arg !== '--confirm')
  if (unknown.length > 0 || positional.length > 0) fail(`Unknown argument: ${[...unknown, ...positional].join(', ')}`)
  if (argv.includes('--confirm') && !writeConfirmed(argv)) {
    fail(`Refusing to write. Re-run with --confirm ${CONFIRM_PHRASE}`)
  }
  return { help, write: writeConfirmed(argv) }
}

function unescapeEnv(value: string): string {
  return value.replace(/\\n/g, '\n').replace(/\\r/g, '\r')
}

function parseEnvFile(text: string): Record<string, string> {
  const values: Record<string, string> = {}
  const pattern = /^([A-Z0-9_]+)=(.*)$/
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = pattern.exec(trimmed)
    if (!match) continue
    let value = match[2]
    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      value = unescapeEnv(value.slice(1, -1))
    } else if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
      value = value.slice(1, -1)
    }
    values[match[1]] = value
  }
  return values
}

function loadLocalAdminEnv(): void {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  let parsed: Record<string, string>
  try {
    parsed = parseEnvFile(readFileSync(path, 'utf8'))
  } catch {
    fail('Could not read .env.local. The file contents were not printed.')
  }
  for (const name of ADMIN_ENV) {
    if (!process.env[name] && parsed[name]) process.env[name] = parsed[name]
  }
}

function requireAdminEnv(): void {
  loadLocalAdminEnv()
  const missing = ADMIN_ENV.filter((name) => !process.env[name])
  if (missing.length > 0) fail(`Missing ${missing.join(', ')}.`)
}

function publicError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Firebase request failed'
  return message
    .replace(/-----BEGIN[\s\S]*?-----END [^-]+-----/g, '[redacted]')
    .replace(/[A-Za-z0-9+/=]{80,}/g, '[redacted]')
}

function asRecord(value: unknown): RawRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as RawRecord
}

function storedTitle(override: RawRecord | null): string | null {
  const title = override?.title
  if (typeof title !== 'string') return null
  const cleaned = title.replace(/\s+/g, ' ').trim()
  return cleaned || null
}

function otherOverrideFields(override: RawRecord | null): string[] {
  if (!override) return []
  return Object.keys(override).filter((key) => key !== 'title').sort()
}

function otherOverrideSnapshot(override: RawRecord | null): string {
  if (!override) return ''
  const rest: RawRecord = {}
  for (const key of otherOverrideFields(override)) rest[key] = override[key]
  return JSON.stringify(rest)
}

function overrideShape(value: unknown): TitleCheck['overrideShape'] {
  if (value == null) return value === null ? 'null' : 'missing'
  return asRecord(value) ? 'map' : 'invalid'
}

export function assessTitleDocument(id: string, data: RawRecord | null): TitleCheck {
  const approvedTitle = APPROVED_GALLERY_TITLES[id]
  if (!approvedTitle) fail(`No approved title for ${id}`)
  if (!data) {
    return {
      id,
      exists: false,
      postIdMatches: false,
      generatedTitle: null,
      storedTitle: null,
      approvedTitle,
      otherOverrideFields: [],
      overrideShape: 'missing',
      safe: false,
    }
  }
  const resourceName = data.resourceName
  let postIdMatches = false
  try {
    postIdMatches = typeof resourceName === 'string' && docIdFromResourceName(resourceName) === id
  } catch {
    postIdMatches = false
  }
  const summary = typeof data.summary === 'string' ? data.summary : ''
  const shape = overrideShape(data.metadataOverride)
  const override = asRecord(data.metadataOverride)
  const safe = postIdMatches && approvedTitle.length > 0 && shape !== 'invalid'
  return {
    id,
    exists: true,
    postIdMatches,
    generatedTitle: galleryMetadata(summary).title,
    storedTitle: storedTitle(override),
    approvedTitle,
    otherOverrideFields: otherOverrideFields(override),
    overrideShape: shape,
    safe,
  }
}

function printCheck(check: TitleCheck): void {
  const stored = check.storedTitle ?? '(none)'
  const kept = check.otherOverrideFields.length > 0 ? check.otherOverrideFields.join(', ') : '(none)'
  console.log(check.id)
  console.log(`  exists: ${check.exists ? 'yes' : 'no'}`)
  console.log(`  post id matches: ${check.postIdMatches ? 'yes' : 'no'}`)
  console.log(`  generated title: ${check.generatedTitle ?? '(none)'}`)
  console.log(`  stored metadataOverride.title: ${stored}`)
  console.log(`  approved title: ${check.approvedTitle}`)
  console.log(`  other override fields kept: ${kept}`)
}

async function readChecks(): Promise<{ checks: TitleCheck[]; otherFields: Map<string, string> }> {
  const { adminDb } = await import('../lib/firebaseAdmin')
  const { GBP_GALLERY_COLLECTION } = await import('../lib/gbpGallery/firestore')
  if (GBP_GALLERY_COLLECTION !== COLLECTION) fail('Gallery collection name drifted.')
  const ids = Object.keys(APPROVED_GALLERY_TITLES)
  const checks: TitleCheck[] = []
  const otherFields = new Map<string, string>()
  for (const id of ids) {
    const snap = await adminDb.collection(GBP_GALLERY_COLLECTION).doc(id).get()
    const data = snap.exists ? asRecord(snap.data()) : null
    const check = assessTitleDocument(id, data)
    checks.push(check)
    otherFields.set(id, otherOverrideSnapshot(asRecord(data?.metadataOverride)))
    printCheck(check)
  }
  return { checks, otherFields }
}

async function writeTitles(checks: TitleCheck[]): Promise<void> {
  const { adminDb } = await import('../lib/firebaseAdmin')
  const batch = adminDb.batch()
  for (const check of checks) {
    const ref = adminDb.collection(COLLECTION).doc(check.id)
    const title = titleFieldUpdate(check.approvedTitle)[TITLE_FIELD]
    if (check.overrideShape === 'map') {
      batch.update(ref, { [TITLE_FIELD]: title })
    } else {
      batch.update(ref, { metadataOverride: { title } })
    }
  }
  await batch.commit()
}

function printUsage(): void {
  console.log(`Reads the ${Object.keys(APPROVED_GALLERY_TITLES).length} approved gallery posts and compares titles.

Dry-run, no writes:
  npx tsx scripts/apply-gallery-title-overrides.ts

Write only metadataOverride.title:
  npx tsx scripts/apply-gallery-title-overrides.ts --confirm ${CONFIRM_PHRASE}

Uses the Firebase Admin variables already read by lib/firebaseAdmin.ts, from the environment or from .env.local. Do not pass those values as arguments.`)
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printUsage()
    return
  }
  requireAdminEnv()
  let checks: TitleCheck[]
  let otherFields: Map<string, string>
  try {
    const read = await readChecks()
    checks = read.checks
    otherFields = read.otherFields
  } catch (error) {
    fail(publicError(error))
  }
  const unsafe = checks.filter((check) => !check.safe)
  if (unsafe.length > 0) {
    fail(`${unsafe.length} document(s) are not safe to update. Nothing was written.`)
  }
  if (!args.write) {
    console.log(`${checks.length} documents match the approved posts. Dry-run only. Nothing was written.`)
    return
  }
  try {
    await writeTitles(checks)
    const reread = await readChecks()
    for (const check of reread.checks) {
      const before = otherFields.get(check.id) ?? ''
      const after = reread.otherFields.get(check.id) ?? ''
      if (check.storedTitle !== check.approvedTitle || before !== after) {
        fail(`Write check failed for ${check.id}. Inspect metadataOverride before retrying.`)
      }
    }
  } catch (error) {
    fail(publicError(error))
  }
  console.log(`Updated metadataOverride.title on ${checks.length} documents. Other override fields were left unchanged.`)
}

const entryArg = process.argv[1]?.replace(/\\/g, '/') ?? ''
if (entryArg.endsWith('scripts/apply-gallery-title-overrides.ts')) {
  main().catch((error: unknown) => {
    fail(publicError(error))
  })
}
