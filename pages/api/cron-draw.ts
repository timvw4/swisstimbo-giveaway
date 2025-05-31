import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

const performAutoDraw = async () => {
  try {
    // Récupère les participants
    const { data: participants } = await supabase
      .from('participants')
      .select('*')

    if (!participants || participants.length === 0) {
      console.log('[CRON] Aucun participant pour le tirage')
      return { success: true, message: 'Aucun participant' }
    }

    // Vérifier qu'on n'a pas déjà fait un tirage récemment (5 minutes)
    const lastDrawCheck = new Date()
    lastDrawCheck.setMinutes(lastDrawCheck.getMinutes() - 5)

    const { data: recentWinner } = await supabase
      .from('winners')
      .select('*')
      .gte('draw_date', lastDrawCheck.toISOString())
      .single()

    if (recentWinner) {
      console.log('[CRON] Tirage déjà effectué récemment')
      return { success: true, message: 'Tirage déjà effectué' }
    }

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

    // 2. Éviter les doublons dans l'historique
    const { data: existingHistory } = await supabase
      .from('participants_history')
      .select('pseudoinstagram')

    const existingPseudos = new Set(
      existingHistory?.map(entry => entry.pseudoinstagram) || []
    )

    const newParticipants = participants.filter(
      participant => !existingPseudos.has(participant.pseudoinstagram)
    )

    // 3. Sauvegarder les nouveaux participants dans l'historique
    if (newParticipants.length > 0) {
      const historyEntries = newParticipants.map(participant => ({
        pseudoinstagram: participant.pseudoinstagram,
        npa: participant.npa,
        created_at: participant.created_at,
        draw_date: winnerData.draw_date,
        draw_id: winnerData.id
      }))

      await supabase.from('participants_history').insert(historyEntries)
    }

    // 4. Supprimer les participants
    await supabase.from('participants').delete().not('id', 'is', null)

    console.log(`[CRON] Tirage effectué - Gagnant: ${winner.pseudoinstagram}`)
    return { 
      success: true, 
      message: `Tirage effectué - Gagnant: ${winner.pseudoinstagram}`,
      winner: winner.pseudoinstagram
    }

  } catch (error) {
    console.error('[CRON] Erreur lors du tirage:', error)
    // Correction TypeScript : vérifier le type de l'erreur
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return { success: false, error: errorMessage }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vérifier que c'est bien un appel de cron (sécurité)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const result = await performAutoDraw()
  res.status(200).json(result)
} 