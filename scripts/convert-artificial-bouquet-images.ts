import { mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import convertHeic from 'heic-convert'
import sharp from 'sharp'

const MAX_DIMENSION = 1600
const WEBP_QUALITY = 82
const EXPECTED_COUNT = 17
const SOURCE_NAME = /^Aranzman\s+(\d+)\.(heic|HEIC)$/

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = join(root, 'assets', 'artificial-bouquets-originals')
const destDir = join(root, 'public', 'images', 'umjetni-buketi')

function fail(message: string): never {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}

function skuFromNumber(n: number): string {
  return `UM-${String(n).padStart(3, '0')}`
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / 1024).toFixed(1)} KB`
}

async function main() {
  const files = readdirSync(sourceDir)
  const byNumber = new Map<number, string>()

  for (const file of files) {
    const match = SOURCE_NAME.exec(file)
    if (!match) {
      console.warn(`Skipping unrecognized file: ${file}`)
      continue
    }
    const number = Number(match[1])
    if (number < 1 || number > EXPECTED_COUNT) {
      fail(`Unexpected arrangement number in ${file}`)
    }
    if (byNumber.has(number)) fail(`Duplicate original for Aranzman ${number}`)
    byNumber.set(number, file)
  }

  const missing = []
  for (let n = 1; n <= EXPECTED_COUNT; n += 1) {
    if (!byNumber.has(n)) missing.push(`Aranzman ${n}.heic`)
  }
  if (missing.length > 0) fail(`Missing originals: ${missing.join(', ')}`)

  mkdirSync(destDir, { recursive: true })

  let originalBytes = 0
  let webpBytes = 0

  console.log(`Converting ${EXPECTED_COUNT} HEIC originals → WebP (max ${MAX_DIMENSION}px, quality ${WEBP_QUALITY})`)

  for (let n = 1; n <= EXPECTED_COUNT; n += 1) {
    const sourceName = byNumber.get(n)
    if (!sourceName) fail(`Missing Aranzman ${n}.heic`)
    const sku = skuFromNumber(n)
    const sourcePath = join(sourceDir, sourceName)
    const destPath = join(destDir, `${sku}.webp`)
    originalBytes += statSync(sourcePath).size

    // Sharp on Windows cannot decode HEVC HEIC; decode first, then optimize.
    const jpegBuffer = Buffer.from(
      await convertHeic({
        buffer: readFileSync(sourcePath),
        format: 'JPEG',
        quality: 1,
      }),
    )

    await sharp(jpegBuffer)
      .rotate()
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toFile(destPath)

    const outSize = statSync(destPath).size
    webpBytes += outSize
    console.log(`  ${sourceName}  →  ${sku}.webp  (${formatBytes(outSize)})`)
  }

  console.log('')
  console.log(`Originals:  ${EXPECTED_COUNT} files, ${formatBytes(originalBytes)} (${originalBytes} bytes)`)
  console.log(`WebP:       ${EXPECTED_COUNT} files, ${formatBytes(webpBytes)} (${webpBytes} bytes)`)
  console.log('Original HEIC files were left unchanged.')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
