import { ImageResponse } from 'next/og'

export const contentType = 'image/png'
export const size = { width: 512, height: 512 }

const CHERRY_WINE = '#8B002D'
const VERDIGRIS = '#4FA393'
const CREAM = '#F7F3EE'

export function GET() {
  return new ImageResponse(
    (
      // Full-bleed background (no rounded corners) — this variant is also
      // declared "maskable" in the manifest, so the OS applies its own
      // shape mask; the cherry mark stays well within the ~80% safe zone.
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: CHERRY_WINE,
        }}
      >
        {/* Stem */}
        <div
          style={{
            position: 'absolute',
            width: 26,
            height: 122,
            background: CREAM,
            borderRadius: 14,
            top: 108,
            left: 288,
            transform: 'rotate(18deg)',
          }}
        />
        {/* Cherry body */}
        <div
          style={{
            width: 176,
            height: 176,
            borderRadius: '50%',
            background: VERDIGRIS,
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
