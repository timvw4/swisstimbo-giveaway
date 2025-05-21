import { supabase } from '@/lib/supabaseClient'
import { Participant } from '@/types'

export const scheduleNextDraw = () => {
  const now = new Date()
  const nextDrawDate = getNextDrawDate()
  const timeUntilDraw = nextDrawDate.getTime() - now.getTime()

  setTimeout(async () => {
    await performDraw()
    scheduleNextDraw() // Planifie le prochain tirage
  }, timeUntilDraw)
}

export const getNextDrawDate = () => {
  const now = new Date()
  const day = now.getDay()
  const hours = now.getHours()
  let nextDate = new Date()
  
  if (day < 2 || (day === 2 && hours < 20)) {
    // Prochain mardi
    nextDate.setDate(nextDate.getDate() + ((2 + 7 - day) % 7))
  } else if (day < 5 || (day === 5 && hours < 20)) {
    // Prochain vendredi
    nextDate.setDate(nextDate.getDate() + ((5 + 7 - day) % 7))
  } else {
    // Prochain mardi
    nextDate.setDate(nextDate.getDate() + ((2 + 7 - day) % 7))
  }
  
  nextDate.setHours(20, 0, 0, 0)
  return nextDate
}

const performDraw = async () => {
  try {
    // Récupérer tous les participants
    const { data: participants } = await supabase
      .from('participants')
      .select('*')

    if (!participants || participants.length === 0) {
      console.log('Aucun participant pour le tirage')
      return
    }

    // Sélectionner un gagnant aléatoire
    const winnerIndex = Math.floor(Math.random() * participants.length)
    const winner = participants[winnerIndex]

    // Enregistrer le gagnant dans la base de données
    await supabase
      .from('winners')
      .insert([{
        participant_id: winner.id,
        draw_date: new Date().toISOString()
      }])

    console.log(`Gagnant du tirage : ${winner.pseudoInstagram}`)
  } catch (error) {
    console.error('Erreur lors du tirage :', error)
  }
} 