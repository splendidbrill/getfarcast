import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { jwtVerify } from 'jose'

const BLOG_PROTECTED = ['/blog-master/dashboard', '/blog-master/new', '/blog-master/edit']

function blogSecret() {
  const s = process.env.BLOG_MASTER_SESSION_SECRET ?? ''
  return new TextEncoder().encode(s)
}

async function isBlogAuthed(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('blog_session')?.value
  if (!token) return false
  try {
    await jwtVerify(token, blogSecret())
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host')

  if (hostname === 'getfarcast.com' && !pathname.startsWith('/api/')) {
    const newUrl = new URL(request.url)
    newUrl.hostname = 'www.getfarcast.com'
    newUrl.port = ''
    newUrl.protocol = 'https:'
    return NextResponse.redirect(newUrl, 308)
  }

  if (BLOG_PROTECTED.some((p) => pathname.startsWith(p))) {
    if (!(await isBlogAuthed(request))) {
      return NextResponse.redirect(new URL('/blog-master', request.url))
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
