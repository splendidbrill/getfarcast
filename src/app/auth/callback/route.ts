import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getBaseUrl(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const { origin } = new URL(request.url)
  if (process.env.NODE_ENV !== 'development' && forwardedHost) {
    return `https://${forwardedHost}`
  }
  return origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'
  const baseUrl = getBaseUrl(request)

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as never })
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
    console.error('[auth/callback] verifyOtp error:', error.message)
  }

  return NextResponse.redirect(`${baseUrl}/login`)
}
