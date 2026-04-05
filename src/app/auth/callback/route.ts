import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect route
  const next = searchParams.get('next') ?? '/dashboard'
  // Get the original sign-in origin from the query parameter
  const signInOrigin = searchParams.get('origin')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Use the sign-in origin if available, otherwise fallback to current logic
      if (signInOrigin) {
        const redirectUrl = `${signInOrigin}${next}`
        console.log('Redirecting to sign-in origin:', redirectUrl)
        return NextResponse.redirect(redirectUrl)
      }

      // Fallback logic (shouldn't be needed with the new approach)
      const isDevelopment = process.env.NODE_ENV === 'development'
      const isLocalhost = origin.includes('localhost')
      const isVercel = origin.includes('vercel.app') || request.headers.get('x-vercel-id')

      console.log('Auth callback debug (fallback):', {
        origin,
        signInOrigin,
        isDevelopment,
        isLocalhost,
        isVercel,
        forwardedHost: request.headers.get('x-forwarded-host'),
        userAgent: request.headers.get('user-agent')?.substring(0, 50)
      })

      if (isDevelopment || isLocalhost) {
        return NextResponse.redirect(`http://localhost:3000${next}`)
      } else if (isVercel) {
        return NextResponse.redirect(`https://getfarcast.vercel.app${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  const errorOrigin = signInOrigin || origin
  return NextResponse.redirect(`${errorOrigin}/auth/auth-code-error`)
}
