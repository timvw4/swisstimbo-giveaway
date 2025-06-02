import { supabase } from '@/lib/supabaseClient'
import { Participant } from '@/types'
import { getNextDrawDate } from './dateUtils'

export const scheduleNextDraw = () => {
  const nextDrawDate = getNextDrawDate()
  const now = new Date()
  const timeUntilDraw = nextDrawDate.getTime() - now.getTime()

  // Vérifier si le tirage n'a pas déjà été effectué
  const lastDrawCheck = new Date(now)
  lastDrawCheck.setMinutes(now.getMinutes() - 5) // 5 minutes de marge

  setTimeout(async () => {
    const { data: recentWinner } = await supabase
      .from('winners')
      .select('*')
      .gte('draw_date', lastDrawCheck.toISOString())
      .single()

    if (!recentWinner) {
      await performAutoDraw()
    }
    
    // Programmer le prochain tirage
    scheduleNextDraw()
  }, timeUntilDraw)
}

const performAutoDraw = async () => {
  try {
    // Récupère les participants
    const { data: participants } = await supabase
      .from('participants')
      .select('*')

    if (!participants || participants.length === 0) return

    // Sélectionne un gagnant aléatoire
    const winnerIndex = Math.floor(Math.random() * participants.length)
    const winner = participants[winnerIndex]

    // 1. Sauvegarder le gagnant
    const { data: winnerData, error: winnerError } = await supabase
      .from('winners')
      .insert([{
        participant_id: winner.id,
        pseudoinstagram: winner.pseudoinstagram,
        draw_date: new Date().toISOString(),
        montant: 20
      }])
      .select()
      .single()

    if (winnerError) throw winnerError

    // 2. Vérifier quels participants ne sont PAS encore dans l'historique
    if (participants && winnerData) {
      // Récupérer tous les pseudos déjà présents dans l'historique
      const { data: existingHistory, error: historyFetchError } = await supabase
        .from('participants_history')
        .select('pseudoinstagram')

      if (historyFetchError) throw historyFetchError

      // Créer un Set des pseudos déjà présents pour une recherche rapide
      const existingPseudos = new Set(
        existingHistory?.map(entry => entry.pseudoinstagram) || []
      )

      // Filtrer pour ne garder que les nouveaux participants
      const newParticipants = participants.filter(
        participant => !existingPseudos.has(participant.pseudoinstagram)
      )

      console.log(`[AUTO DRAW] Participants total: ${participants.length}`)
      console.log(`[AUTO DRAW] Participants déjà dans l'historique: ${existingPseudos.size}`)
      console.log(`[AUTO DRAW] Nouveaux participants à ajouter: ${newParticipants.length}`)

      // Sauvegarder SEULEMENT les nouveaux participants dans l'historique
      if (newParticipants.length > 0) {
        const historyEntries = newParticipants.map(participant => ({
          pseudoinstagram: participant.pseudoinstagram,
          npa: participant.npa,
          created_at: participant.created_at,
          draw_date: winnerData.draw_date,
          draw_id: winnerData.id
        }))

        const { error: historyError } = await supabase
          .from('participants_history')
          .insert(historyEntries)

        if (historyError) throw historyError
        
        console.log(`[AUTO DRAW] ${newParticipants.length} nouveaux participants ajoutés à l'historique`)
      } else {
        console.log('[AUTO DRAW] Aucun nouveau participant à ajouter (tous déjà présents dans l\'historique)')
      }
    }

    // 3. Supprimer IMMÉDIATEMENT les participants de la base de données
    const { error: deleteError } = await supabase
      .from('participants')
      .delete()
      .not('id', 'is', null)

    if (deleteError) throw deleteError

  } catch (error) {
    console.error('Erreur lors du tirage automatique:', error)
  }
} 