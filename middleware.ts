import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Pages exclues du mode maintenance (admin, API, maintenance elle-même)
  const excludedPaths = [
    '/admin',
    '/api/',
    '/maintenance',
    '/_next/',
    '/favicon.ico',
    '/images/'
  ]

  // Vérifier si le chemin est exclu
  const isExcluded = excludedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isExcluded) {
    return NextResponse.next()
  }

  try {
    // Vérifier le mode maintenance via l'API
    const maintenanceResponse = await fetch(
      new URL('/api/maintenance', request.url),
      { method: 'GET' }
    )

    if (maintenanceResponse.ok) {
      const { maintenanceMode } = await maintenanceResponse.json()
      
      if (maintenanceMode) {
        // Rediriger vers la page de maintenance
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
    }
  } catch (error) {
    console.error('Erreur middleware maintenance:', error)
    // En cas d'erreur, laisser passer (ne pas bloquer le site)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 