'use client'

import { useEffect, useState } from 'react'

/**
 * Tracks a `max-width` media query. Defaults to `false` (desktop) so SSR
 * and first client paint agree — it flips synchronously in a layout effect
 * before the browser paints, so there's no visible animation "upgrade" flash.
 */
export function useIsMobile(breakpointPx = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpointPx}px)`)
    setIsMobile(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [breakpointPx])

  return isMobile
}
