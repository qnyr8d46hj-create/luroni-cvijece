import { ImageResponse } from 'next/og'
import { readFileSync }  from 'fs'
import { join }          from 'path'

// Next.js App Router file convention — served at /apple-icon.png (180×180)
export const size        = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  // Read icon.PNG directly from the file system at build time — no HTTP fetch
  // needed, works on both Windows (case-insensitive) and Linux (exact match).
  const iconBuffer = readFileSync(join(process.cwd(), 'app', 'icon.PNG'))
  const iconSrc    = `data:image/png;base64,${iconBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width:           '100%',
          height:          '100%',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          backgroundColor: '#faf9f6',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt=""
          width={160}
          height={160}
          style={{ objectFit: 'contain' }}
        />
      </div>
    ),
    { ...size }
  )
}
