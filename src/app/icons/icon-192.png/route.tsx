import { ImageResponse } from 'next/og'

export const contentType = 'image/png'
export const size = { width: 192, height: 192 }

const CHERRY_WINE = '#8B002D'
const VERDIGRIS = '#4FA393'
const CREAM = '#F7F3EE'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: CHERRY_WINE,
          borderRadius: 42,
        }}
      >
        {/* Stem */}
        <div
          style={{
            position: 'absolute',
            width: 10,
            height: 46,
            background: CREAM,
            borderRadius: 6,
            top: 34,
            left: 108,
            transform: 'rotate(18deg)',
          }}
        />
        {/* Cherry body */}
        <div
          style={{
            width: 92,
            height: 92,
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
