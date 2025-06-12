import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

// Générer un ID de session unique
const generateSessionId = () => {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
}

export const useSessionTracking = () => {
  const router = useRouter()
  const sessionIdRef = useRef<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fonction pour envoyer le heartbeat
  const sendHeartbeat = async (page?: string) => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = generateSessionId()
    }

    try {
      await fetch('/api/track-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          page: page || router.pathname
        }),
      })
    } catch (error) {
      console.error('Erreur lors du tracking de session:', error)
    }
  }

  useEffect(() => {
    // Envoyer le premier heartbeat
    sendHeartbeat()

    // Configurer l'intervalle pour envoyer un heartbeat toutes les 30 secondes
    intervalRef.current = setInterval(() => {
      sendHeartbeat()
    }, 30 * 1000) // 30 secondes

    // Nettoyer à la fermeture
    const cleanup = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    // Écouter les changements de page
    const handleRouteChange = (url: string) => {
      sendHeartbeat(url)
    }

    router.events.on('routeChangeComplete', handleRouteChange)

    // Nettoyer lors du démontage du composant
    return () => {
      cleanup()
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])

  return { sessionId: sessionIdRef.current }
} 