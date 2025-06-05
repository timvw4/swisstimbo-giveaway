import { supabase } from '@/lib/supabaseClient'
import { getNextDrawDate } from './dateUtils'

export const scheduleNextDraw = () => {
  const nextDrawDate = getNextDrawDate()
  const now = new Date()
  const timeUntilDraw = nextDrawDate.getTime() - now.getTime()

  console.log(`[AUTO DRAW] Prochain tirage programmé pour: ${nextDrawDate}`)

  setTimeout(async () => {
    // Vérifier qu'on n'a pas déjà fait un tirage récent (5 minutes de marge)
    const lastDrawCheck = new Date()
    lastDrawCheck.setMinutes(lastDrawCheck.getMinutes() - 5)

    const { data: recentWinner } = await supabase
      .from('winners')
      .select('*')
      .gte('draw_date', lastDrawCheck.toISOString())
      .single()

    if (!recentWinner) {
      console.log('[AUTO DRAW] Déclenchement du tirage automatique...')
      
      try {
        // Appeler l'API centralisée
        const response = await fetch('/api/perform-draw', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AUTO_DRAW_SECRET || 'auto-draw'}`
          }
        })
        
        const result = await response.json()
        
        if (result.success) {
          console.log(`[AUTO DRAW] Tirage réussi - Gagnant: ${result.winner.pseudoinstagram}`)
        } else {
          console.log(`[AUTO DRAW] Échec du tirage: ${result.error}`)
        }
      } catch (error) {
        console.error('[AUTO DRAW] Erreur lors de l\'appel API:', error)
      }
    } else {
      console.log('[AUTO DRAW] Tirage déjà effectué récemment, ignoré')
    }
    
    // Programmer le prochain tirage
    scheduleNextDraw()
  }, timeUntilDraw)
} 