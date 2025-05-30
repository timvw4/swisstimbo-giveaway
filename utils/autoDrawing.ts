import { supabase } from '@/lib/supabaseClient'
import { Participant } from '@/types'

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

    // 2. Sauvegarder tous les participants dans l'historique
    if (participants && winnerData) {
      const historyEntries = participants.map(participant => ({
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

export const getNextDrawDate = () => {
  const now = new Date()
  const day = now.getDay() // 0 = dimanche, 3 = mercredi
  const hours = now.getHours()
  let nextDate = new Date(now)
  
  if (day === 0) {
    // Si on est dimanche
    if (hours >= 20) {
      // Après 20h -> prochain mercredi
      nextDate.setDate(nextDate.getDate() + 3)
    }
  } else if (day < 3) {
    // Entre lundi et mardi -> prochain mercredi
    nextDate.setDate(nextDate.getDate() + (3 - day))
  } else if (day === 3) {
    // Si on est mercredi
    if (hours >= 20) {
      // Après 20h -> prochain dimanche
      nextDate.setDate(nextDate.getDate() + 4)
    }
  } else {
    // Entre jeudi et samedi -> prochain dimanche
    nextDate.setDate(nextDate.getDate() + (7 - day))
  }
  
  nextDate.setHours(20, 0, 0, 0)
  return nextDate
} 