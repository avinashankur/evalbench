import { type NextRequest, NextResponse } from 'next/server'

const authPaths = ['/login', '/signup']
const publicPaths = ['/', '/api/auth', ...authPaths]

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function isAuthPath(pathname: string): boolean {
  return authPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for Better Auth session cookie (including secure cookie prefix)
  const sessionCookie =
    request.cookies.get('better-auth.session_token') ||
    request.cookies.get('__Secure-better-auth.session_token')

  // Redirect authenticated users away from auth pages to dashboard
  if (sessionCookie && isAuthPath(pathname)) {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl')
    const destination = callbackUrl && !isAuthPath(callbackUrl) ? callbackUrl : '/dashboard'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // If unauthenticated and accessing protected route, redirect to login
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
