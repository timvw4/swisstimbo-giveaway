// Nouveau fichier API pour le tirage centralisé
import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Vérifier qu'on n'a pas déjà fait un tirage récemment (1 minute)
    const lastDrawCheck = new Date()
    lastDrawCheck.setMinutes(lastDrawCheck.getMinutes() - 1)

    const { data: recentWinner } = await supabase
      .from('winners')
      .select('*')
      .gte('draw_date', lastDrawCheck.toISOString())
      .single()

    if (recentWinner) {
      return res.status(400).json({ 
        error: 'Un tirage a déjà été effectué récemment',
        winner: recentWinner 
      })
    }

    // Récupérer les participants
    const { data: participants } = await supabase
      .from('participants')
      .select('*')

    if (!participants || participants.length === 0) {
      return res.status(400).json({ error: 'Aucun participant' })
    }

    // TIRAGE UNIQUE côté serveur
    const winnerIndex = Math.floor(Math.random() * participants.length)
    const winner = participants[winnerIndex]

    // Sauvegarder le gagnant
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

    // Éviter les doublons dans l'historique
    const { data: existingHistory } = await supabase
      .from('participants_history')
      .select('pseudoinstagram')

    const existingPseudos = new Set(
      existingHistory?.map(entry => entry.pseudoinstagram) || []
    )

    const newParticipants = participants.filter(
      participant => !existingPseudos.has(participant.pseudoinstagram)
    )

    // Sauvegarder les nouveaux participants
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

    // Supprimer les participants
    await supabase.from('participants').delete().not('id', 'is', null)

    return res.status(200).json({
      success: true,
      winner: winnerData,
      allParticipants: participants
    })

  } catch (error) {
    console.error('Erreur tirage:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return res.status(500).json({ error: errorMessage })
  }
} 