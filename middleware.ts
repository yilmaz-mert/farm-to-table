import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user } = await updateSession(request)

  const isAdminRoute =
    pathname.startsWith('/admin') && pathname !== '/admin/login'

  if (isAdminRoute && !user) {
    const loginUrl = new URL('/admin/login', request.url)
    if (pathname !== '/admin') {
      loginUrl.searchParams.set('from', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // Role (admin vs. customer) is verified in `(admin)/layout.tsx`, which has
  // DB access — middleware only gates on session existence to stay
  // lightweight. Note: we deliberately do NOT bounce an authenticated
  // non-admin session away from `/admin/login`, since the layout redirects
  // non-admins back to `/admin/login` on role-mismatch; bouncing them away
  // from there too would create an infinite redirect loop.
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
