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

    // 🔧 AMÉLIORATION : Éviter les doublons de manière plus précise
    const { data: existingHistory } = await supabase
      .from('participants_history')
      .select('pseudoinstagram, npa, created_at')

    // Créer une clé unique pour chaque participant (pseudo + npa + date inscription)
    const existingKeys = new Set(
      existingHistory?.map(entry => 
        `${entry.pseudoinstagram}_${entry.npa}_${entry.created_at}`
      ) || []
    )

    // Filtrer pour ne garder que les participants vraiment nouveaux
    const newParticipants = participants.filter(participant => {
      const participantKey = `${participant.pseudoinstagram}_${participant.npa}_${participant.created_at}`
      return !existingKeys.has(participantKey)
    })

    console.log(`[PERFORM DRAW] Participants total: ${participants.length}`)
    console.log(`[PERFORM DRAW] Participants déjà dans l'historique: ${existingKeys.size}`)
    console.log(`[PERFORM DRAW] Nouveaux participants à ajouter: ${newParticipants.length}`)

    // Sauvegarder SEULEMENT les nouveaux participants
    if (newParticipants.length > 0) {
      const historyEntries = newParticipants.map(participant => ({
        pseudoinstagram: participant.pseudoinstagram,
        npa: participant.npa,
        created_at: participant.created_at,
        draw_date: winnerData.draw_date,
        draw_id: winnerData.id
      }))

      // 🔧 AMÉLIORATION : Utiliser upsert avec gestion des conflits
      const { error: historyError } = await supabase
        .from('participants_history')
        .upsert(historyEntries, { 
          onConflict: 'pseudoinstagram,created_at',
          ignoreDuplicates: true 
        })

      if (historyError) {
        console.error('Erreur lors de l\'ajout à l\'historique:', historyError)
        // Ne pas arrêter le processus si l'historique échoue
      } else {
        console.log(`[PERFORM DRAW] ${newParticipants.length} nouveaux participants ajoutés à l'historique`)
      }
    } else {
      console.log('[PERFORM DRAW] Aucun nouveau participant à ajouter (tous déjà présents dans l\'historique)')
    }

    // Supprimer les participants
    await supabase.from('participants').delete().not('id', 'is', null)

    return res.status(200).json({
      success: true,
      winner: winnerData,
      allParticipants: participants,
      newParticipantsAdded: newParticipants.length
    })

  } catch (error) {
    console.error('Erreur tirage:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return res.status(500).json({ error: errorMessage })
  }
} 