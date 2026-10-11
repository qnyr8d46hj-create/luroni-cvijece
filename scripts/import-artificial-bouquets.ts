import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  ARTIFICIAL_BOUQUETS_COLLECTION,
  firestorePayloadFromProduct,
  parseArtificialBouquet,
  type ArtificialBouquet,
} from '../lib/artificialBouquets'

const REQUIRED_COLUMNS = [
  'sku',
  'name',
  'priceEur',
  'image',
  'available',
  'active',
  'sortOrder',
] as const

function fail(message: string): never {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}

function parseArgs(argv: string[]) {
  const flags = new Set(argv.filter(arg => arg.startsWith('--')))
  const positional = argv.filter(arg => !arg.startsWith('--'))
  const unknown = [...flags].filter(
    flag => flag !== '--confirm' && flag !== '--overwrite' && flag !== '--dry-run' && flag !== '--help',
  )
  if (unknown.length > 0) fail(`Unknown flag: ${unknown.join(', ')}`)
  return {
    help: flags.has('--help'),
    confirm: flags.has('--confirm'),
    overwrite: flags.has('--overwrite'),
    file: positional[0],
  }
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
      continue
    }
    if (char === '"') {
      inQuotes = true
      continue
    }
    if (char === ',') {
      cells.push(current)
      current = ''
      continue
    }
    current += char
  }
  cells.push(current)
  return cells.map(cell => cell.trim())
}

function parseCsv(raw: string): Record<string, string>[] {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  if (lines.length === 0) fail('CSV is empty')

  const header = parseCsvLine(lines[0]).map(column => column.trim())
  for (const column of REQUIRED_COLUMNS) {
    if (!header.includes(column)) fail(`CSV is missing column: ${column}`)
  }

  return lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line)
    if (cells.length !== header.length) {
      fail(`Row ${index + 2} has ${cells.length} cells, expected ${header.length}`)
    }
    const row: Record<string, string> = {}
    header.forEach((column, columnIndex) => {
      row[column] = cells[columnIndex] ?? ''
    })
    return row
  })
}

function printHelp() {
  console.log(`Import artificial bouquets into Firestore.

Usage:
  npx tsx scripts/import-artificial-bouquets.ts <file.csv>
  npx tsx scripts/import-artificial-bouquets.ts <file.csv> --confirm
  npx tsx scripts/import-artificial-bouquets.ts <file.csv> --confirm --overwrite

Default is dry-run (no writes). --confirm is required for production writes.
Existing documents are skipped unless --overwrite is also set.
All rows are validated before any write.

Template: scripts/artificial-bouquets.template.csv
Guide:    scripts/artificial-bouquets.md
`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.file) {
    printHelp()
    process.exit(args.help ? 0 : 1)
  }

  const csvPath = resolve(args.file)
  const rows = parseCsv(readFileSync(csvPath, 'utf8'))
  if (rows.length === 0) fail('CSV has a header but no product rows')

  const products: ArtificialBouquet[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    const sku = row.sku.trim()
    if (seen.has(sku)) fail(`Duplicate SKU in CSV: ${sku}`)
    seen.add(sku)
    const result = parseArtificialBouquet(sku, row)
    if ('issue' in result) fail(`${result.issue.sku}: ${result.issue.reason}`)
    products.push(result.product)
  }

  console.log(`Validated ${products.length} row(s). Collection: ${ARTIFICIAL_BOUQUETS_COLLECTION}`)
  for (const product of products) {
    console.log(
      `  ${product.sku}  ${product.name}  ${product.priceEur} €  available=${product.available}  active=${product.active}  ${product.image}`,
    )
  }

  if (!args.confirm) {
    console.log('Dry-run only. Re-run with --confirm to write.')
    return
  }

  const { adminDb } = await import('../lib/firebaseAdmin')
  const existingSnaps = await Promise.all(
    products.map(product => adminDb.collection(ARTIFICIAL_BOUQUETS_COLLECTION).doc(product.sku).get()),
  )

  const toWrite: ArtificialBouquet[] = []
  for (let i = 0; i < products.length; i += 1) {
    const product = products[i]
    const exists = existingSnaps[i].exists
    if (exists && !args.overwrite) {
      console.log(`SKIP existing ${product.sku} (pass --overwrite to replace)`)
      continue
    }
    toWrite.push(product)
  }

  if (toWrite.length === 0) {
    console.log('Nothing to write.')
    return
  }

  const batch = adminDb.batch()
  for (const product of toWrite) {
    const ref = adminDb.collection(ARTIFICIAL_BOUQUETS_COLLECTION).doc(product.sku)
    batch.set(ref, firestorePayloadFromProduct(product), { merge: false })
  }
  await batch.commit()
  console.log(`Wrote ${toWrite.length} document(s).`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
