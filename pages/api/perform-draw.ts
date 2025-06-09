// Nouveau fichier API pour le tirage centralisé
import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

// 🔧 NOUVEAU : Variable globale pour verrouiller les tirages simultanés
let drawInProgress = false

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 🔧 NOUVEAU : Vérification immédiate du verrou
  if (drawInProgress) {
    console.log('[PERFORM DRAW] Tirage déjà en cours, requête rejetée')
    return res.status(429).json({ error: 'Un tirage est déjà en cours' })
  }

  // 🔧 NOUVEAU : Activer le verrou
  drawInProgress = true

  try {
    // 🔧 AMÉLIORATION MAJEURE : Vérifier qu'aucun tirage n'a eu lieu AUJOURD'HUI
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Début de la journée à 00:00:00
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1) // Fin de la journée à 23:59:59

    const { data: todayWinners } = await supabase
      .from('winners')
      .select('*')
      .gte('draw_date', today.toISOString())
      .lt('draw_date', tomorrow.toISOString())

    if (todayWinners && todayWinners.length > 0) {
      console.log('[PERFORM DRAW] Tirage déjà effectué aujourd\'hui, annulation')
      console.log('[PERFORM DRAW] Gagnants d\'aujourd\'hui:', todayWinners.map(w => `${w.pseudoinstagram} à ${w.draw_date}`))
      return res.status(400).json({ 
        error: 'Un tirage a déjà été effectué aujourd\'hui',
        todayWinners: todayWinners 
      })
    }

    // 🔧 AMÉLIORATION : Vérification supplémentaire des tirages récents (30 minutes)
    const recentCheck = new Date()
    recentCheck.setMinutes(recentCheck.getMinutes() - 30)

    // 🔧 CORRECTION : Utiliser .maybeSingle() pour éviter l'erreur 406
    const { data: recentWinner } = await supabase
      .from('winners')
      .select('*')
      .gte('draw_date', recentCheck.toISOString())
      .maybeSingle() // ✅ CORRIGÉ : maybeSingle permet 0 ou 1 ligne sans erreur

    if (recentWinner) {
      console.log('[PERFORM DRAW] Tirage très récent détecté (moins de 30min), annulation')
      return res.status(400).json({ 
        error: 'Un tirage très récent a été détecté',
        recentWinner: recentWinner 
      })
    }

    // Récupérer les participants
    const { data: participants } = await supabase
      .from('participants')
      .select('*')

    if (!participants || participants.length === 0) {
      console.log('[PERFORM DRAW] Aucun participant trouvé')
      return res.status(400).json({ error: 'Aucun participant' })
    }

    console.log(`[PERFORM DRAW] Début du tirage avec ${participants.length} participants`)

    // 🔧 AMÉLIORATION : Vérification que c'est bien un jour de tirage
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = dimanche, 3 = mercredi
    const currentHour = now.getHours()
    const currentMinutes = now.getMinutes()

    // 🔧 CORRECTION : Tirage autorisé UNIQUEMENT à 20h pile (avec une marge de 2 minutes seulement)
    const isCorrectDay = (dayOfWeek === 0 || dayOfWeek === 3) // Dimanche ou mercredi
    const isCorrectTime = currentHour === 20 && currentMinutes >= 0 && currentMinutes <= 1

    if (!isCorrectDay || !isCorrectTime) {
      console.log(`[PERFORM DRAW] Tirage tenté en dehors des heures autorisées`)
      console.log(`[PERFORM DRAW] Jour actuel: ${dayOfWeek} (0=dimanche, 3=mercredi)`)
      console.log(`[PERFORM DRAW] Heure actuelle: ${currentHour}h${currentMinutes.toString().padStart(2, '0')}`)
      console.log('[PERFORM DRAW] Tirages autorisés: Dimanche et Mercredi à 20h00-20h01 UNIQUEMENT')
      
      // En mode développement, permettre quand même le tirage
      if (process.env.NODE_ENV !== 'development') {
        return res.status(400).json({ 
          error: 'Tirage autorisé seulement les mercredis et dimanches à 20h pile (±1 minute)',
          currentDay: dayOfWeek,
          currentTime: `${currentHour}h${currentMinutes.toString().padStart(2, '0')}`,
          expectedDays: [0, 3], // Dimanche, Mercredi
          expectedTime: '20h00-20h01'
        })
      } else {
        console.log('[PERFORM DRAW] Mode développement: tirage autorisé malgré l\'horaire')
      }
    }

    console.log(`[PERFORM DRAW] ✅ Tirage autorisé - ${dayOfWeek === 0 ? 'Dimanche' : 'Mercredi'} à ${currentHour}h${currentMinutes.toString().padStart(2, '0')}`)

    // TIRAGE UNIQUE côté serveur
    const winnerIndex = Math.floor(Math.random() * participants.length)
    const winner = participants[winnerIndex]

    console.log(`[PERFORM DRAW] Gagnant sélectionné: ${winner.pseudoinstagram}`)

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

    if (winnerError) {
      console.error('[PERFORM DRAW] Erreur lors de la sauvegarde du gagnant:', winnerError)
      throw winnerError
    }

    console.log(`[PERFORM DRAW] Gagnant sauvegardé avec l'ID: ${winnerData.id}`)

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
    console.log('[PERFORM DRAW] Suppression des participants de la table active...')
    await supabase.from('participants').delete().not('id', 'is', null)

    console.log('[PERFORM DRAW] Tirage terminé avec succès !')

    return res.status(200).json({
      success: true,
      winner: winnerData,
      allParticipants: participants,
      newParticipantsAdded: newParticipants.length,
      message: 'Tirage effectué avec succès - Protection anti-doublons renforcée'
    })

  } catch (error) {
    console.error('[PERFORM DRAW] Erreur tirage:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return res.status(500).json({ error: errorMessage })
  } finally {
    // 🔧 NOUVEAU : Toujours libérer le verrou
    drawInProgress = false
    console.log('[PERFORM DRAW] Verrou de tirage libéré')
  }
} 