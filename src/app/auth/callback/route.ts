import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  const cookieStore = await cookies()
  const cookieNext = cookieStore.get('nextUrl')?.value
  
  // if "next" is in param, use it as the redirect route. Fallback to cookie.
  const next = searchParams.get('next') || (cookieNext ? decodeURIComponent(cookieNext) : null) || '/dashboard'

  console.log('Auth callback triggered:', {
    origin,
    code: code ? 'present' : 'missing',
    userAgent: request.headers.get('user-agent')?.substring(0, 50),
    referer: request.headers.get('referer')
  })

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const isVercel = origin.includes('vercel.app') || request.headers.get('x-vercel-id')
      const hasLocalhostReferer = request.headers.get('referer')?.includes('localhost') ||
                                  request.headers.get('referer')?.includes('127.0.0.1')

      console.log('Environment check:', {
        isVercel,
        hasLocalhostReferer,
        origin,
        referer: request.headers.get('referer')
      })

      // If we're on Vercel but the request came from localhost, show a redirect page
      if (isVercel && hasLocalhostReferer) {
        console.log('Localhost sign-in detected on production, showing redirect page')
        const redirectPage = `
<!DOCTYPE html>
<html>
<head>
  <title>GetFarcast - Authentication Complete</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px; background: #09090f; color: #e4e4e7; }
    .container { max-width: 500px; margin: 0 auto; }
    .button { background: linear-gradient(135deg, #ff6b4e, #ff8c5a); color: white; padding: 12px 24px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px; }
    .button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✅ Authentication Successful!</h1>
    <p>You signed in from your local development environment.</p>
    <p>Please return to your localhost app to continue.</p>
    <a href="http://localhost:3000${next}" class="button">Go to Localhost App</a>
    <p style="margin-top: 20px; font-size: 14px; color: #a0a0a0;">
      If the link doesn't work, manually navigate to <strong>http://localhost:3000${next}</strong>
    </p>
  </div>
</body>
</html>`
        return new Response(redirectPage, {
          headers: { 'Content-Type': 'text/html' }
        })
      }

      // Normal production flow
      if (isVercel) {
        const response = NextResponse.redirect(`${origin}${next}`)
        response.cookies.delete('nextUrl')
        return response
      }

      // Development environment
      const response = NextResponse.redirect(`http://localhost:3000${next}`)
      response.cookies.delete('nextUrl')
      return response
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
