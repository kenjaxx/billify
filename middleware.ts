import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() hits Supabase Auth server — not just the local JWT
  const { data: { user }, error } = await supabase.auth.getUser()

  const protectedRoutes = ['/dashboard', '/bills', '/budgets', '/reports', '/settings']
  const authRoutes = ['/login', '/register']

  const isProtected = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route =>
    request.nextUrl.pathname === route
  )

  // No valid user (deleted, expired, or never logged in)
  if (!user || error) {
    if (isProtected) {
      // Clear the stale session cookies before redirecting
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
      request.cookies.getAll().forEach(({ name }) => {
        if (name.includes('sb-') || name.includes('supabase')) {
          redirectResponse.cookies.delete(name)
        }
      })
      return redirectResponse
    }
    return supabaseResponse
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}