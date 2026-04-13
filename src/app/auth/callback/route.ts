import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  const cookieStore = await cookies()
  const cookieNext = cookieStore.get('nextUrl')?.value

  // Prefer ?next= param, fallback to cookie, fallback to /dashboard
  const next = searchParams.get('next')
    || (cookieNext ? decodeURIComponent(cookieNext) : null)
    || '/dashboard'

  console.log('[auth/callback] code present:', !!code, '| next:', next, '| origin:', origin)

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const supabase = await createClient()
  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  // Set up free trial if no active subscription exists
  const user = sessionData?.user
  if (user) {
    const { createClient: createAdmin } = await import("@supabase/supabase-js")
    const adminClient = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: adminUser } = await adminClient.auth.admin.getUserById(user.id)
    const appMeta = (adminUser as any).user?.app_metadata || {}

    if (!appMeta.subscription_status || appMeta.subscription_status === 'none') {
      console.log(`[auth/callback] Setting up trial for user: ${user.id}`)
      const trialStart = new Date().toISOString()
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

      const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...appMeta,
          subscription_status: 'on_trial',
          trial_start_date: trialStart,
          trial_end_date: trialEnd,
        },
      })

      if (updateError) {
        console.error("[auth/callback] Failed to set trial:", updateError.message)
      } else {
        console.log("[auth/callback] Trial set successfully")
        await supabase.auth.refreshSession()
      }
    } else if (appMeta.subscription_status === 'canceled' || (appMeta.subscription_status === 'on_trial' && appMeta.trial_end_date && new Date() > new Date(appMeta.trial_end_date))) {
      console.log(`[auth/callback] User ${user.id} trial exhausted, routing to /expired-trial`)
      const response = NextResponse.redirect(`${origin}/expired-trial`)
      response.cookies.delete('nextUrl')
      return response
    }
  }

  const response = NextResponse.redirect(`${origin}${next}`)
  response.cookies.delete('nextUrl')
  console.log('[auth/callback] Redirecting to:', `${origin}${next}`)
  return response
}
