import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  const cookieStore = await cookies()
  const cookieNext = cookieStore.get('nextUrl')?.value

  // Prefer ?next= param, fallback to cookie, fallback to /api/checkout/starter
  // (so new users always get routed to checkout first, not dashboard)
  const next = searchParams.get('next')
    || (cookieNext ? decodeURIComponent(cookieNext) : null)
    || '/api/checkout/starter'

  console.log('[auth/callback] code present:', !!code, '| next:', next, '| origin:', origin)

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const response = NextResponse.redirect(`${origin}${next}`)
  response.cookies.delete('nextUrl')
  console.log('[auth/callback] Redirecting to:', `${origin}${next}`)
  return response
}
