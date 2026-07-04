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

  if (pathname === '/admin/login' && user) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
