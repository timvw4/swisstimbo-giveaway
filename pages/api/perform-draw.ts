// Nouveau fichier API pour le tirage centralisé
import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

// 🔧 NOUVEAU : Variable globale pour verrouiller les tirages simultanés
let drawInProgress = false

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[PERFORM DRAW] Début du processus de tirage')
  
  // 🎯 NOUVEAU : Configuration pour gain spécial (modifier ici pour activer)
  const GAIN_SPECIAL = {
    actif: true, // ✨ Mettre à false pour revenir au gain normal
    montant: 50, // 💰 Montant du gain spécial
    description: "🎉 TIRAGE SPÉCIAL - 50 CHF Zalando !"
  }
  
  const montantGain = GAIN_SPECIAL.actif ? GAIN_SPECIAL.montant : 20

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

    // 🔧 CORRECTION : Tirage autorisé UNIQUEMENT à 18h00 UTC = 20h00 CEST (heure suisse)
    const isCorrectDay = (dayOfWeek === 0 || dayOfWeek === 3) // Dimanche ou mercredi
    const isCorrectTime = currentHour === 18 && currentMinutes >= 0 && currentMinutes <= 1

    if (!isCorrectDay || !isCorrectTime) {
      console.log(`[PERFORM DRAW] Tirage tenté en dehors des heures autorisées`)
      console.log(`[PERFORM DRAW] Jour actuel: ${dayOfWeek} (0=dimanche, 3=mercredi)`)
      console.log(`[PERFORM DRAW] Heure actuelle: ${currentHour}h${currentMinutes.toString().padStart(2, '0')} UTC = ${(currentHour + 2) % 24}h${currentMinutes.toString().padStart(2, '0')} CEST`)
      console.log('[PERFORM DRAW] Tirages autorisés: Dimanche et Mercredi à 18h00-18h01 UTC (20h00-20h01 Suisse) UNIQUEMENT')
      
      // En mode développement, permettre quand même le tirage
      if (process.env.NODE_ENV !== 'development') {
        return res.status(400).json({ 
          error: 'Tirage autorisé seulement les mercredis et dimanches à 20h00 heure suisse (18h00 UTC ±1 minute)',
          currentDay: dayOfWeek,
          currentTime: `${currentHour}h${currentMinutes.toString().padStart(2, '0')} UTC`,
          currentTimeSwiss: `${(currentHour + 2) % 24}h${currentMinutes.toString().padStart(2, '0')} CEST`,
          expectedDays: [0, 3], // Dimanche, Mercredi
          expectedTime: '18h00-18h01 UTC (20h00-20h01 CEST)'
        })
      } else {
        console.log('[PERFORM DRAW] Mode développement: tirage autorisé malgré l\'horaire')
      }
    }

    console.log(`[PERFORM DRAW] ✅ Tirage autorisé - ${dayOfWeek === 0 ? 'Dimanche' : 'Mercredi'} à ${currentHour}h${currentMinutes.toString().padStart(2, '0')} UTC (${(currentHour + 2) % 24}h${currentMinutes.toString().padStart(2, '0')} CEST)`)

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
        montant: montantGain
      }])
      .select()
      .single()

    if (winnerError) {
      console.error('[PERFORM DRAW] Erreur lors de la sauvegarde du gagnant:', winnerError)
      throw winnerError
    }

    console.log(`[PERFORM DRAW] Gagnant sauvegardé avec l'ID: ${winnerData.id}`)

    // 🔧 CORRECTION MAJEURE : Éviter les vrais doublons basés uniquement sur le pseudoinstagram
    const { data: existingHistory } = await supabase
      .from('participants_history')
      .select('pseudoinstagram')

    // Créer un Set des pseudos déjà dans l'historique
    const existingPseudos = new Set(
      existingHistory?.map(entry => entry.pseudoinstagram) || []
    )

    console.log(`[PERFORM DRAW] Pseudos déjà dans l'historique: ${existingPseudos.size}`)
    console.log(`[PERFORM DRAW] Pseudos existants:`, Array.from(existingPseudos).slice(0, 5)) // Afficher les 5 premiers pour debug

    // Filtrer pour ne garder que les participants VRAIMENT nouveaux (première participation jamais vue)
    const firstTimeParticipants = participants.filter(participant => {
      const isNew = !existingPseudos.has(participant.pseudoinstagram)
      if (!isNew) {
        console.log(`[PERFORM DRAW] ${participant.pseudoinstagram} déjà vu, ignoré`)
      }
      return isNew
    })

    console.log(`[PERFORM DRAW] 📊 Analyse des participants:`)
    console.log(`[PERFORM DRAW]   - Total participants actuels: ${participants.length}`)
    console.log(`[PERFORM DRAW]   - Participants déjà dans l'historique: ${participants.length - firstTimeParticipants.length}`)
    console.log(`[PERFORM DRAW]   - Nouveaux participants (première fois): ${firstTimeParticipants.length}`)

    // Sauvegarder SEULEMENT les participants qui participent pour la première fois
    if (firstTimeParticipants.length > 0) {
      const historyEntries = firstTimeParticipants.map(participant => ({
        pseudoinstagram: participant.pseudoinstagram,
        npa: participant.npa,
        created_at: participant.created_at, // Date de leur première inscription
        draw_date: winnerData.draw_date, // Date du tirage actuel
        draw_id: winnerData.id // ID du tirage actuel
      }))

      console.log(`[PERFORM DRAW] Ajout de ${firstTimeParticipants.length} nouveaux participants à l'historique:`)
      firstTimeParticipants.forEach(p => {
        console.log(`[PERFORM DRAW]   - ${p.pseudoinstagram} (première participation)`)
      })

      // 🔧 AMÉLIORATION : Utiliser insert simple puisqu'on a déjà filtré les doublons
      const { error: historyError } = await supabase
        .from('participants_history')
        .insert(historyEntries)

      if (historyError) {
        console.error('[PERFORM DRAW] Erreur lors de l\'ajout à l\'historique:', historyError)
        // Ne pas arrêter le processus si l'historique échoue
      } else {
        console.log(`[PERFORM DRAW] ✅ ${firstTimeParticipants.length} nouveaux participants ajoutés à l'historique avec succès`)
      }
    } else {
      console.log('[PERFORM DRAW] 👥 Aucun nouveau participant - Tous ont déjà participé au moins une fois')
    }

    // Supprimer les participants
    console.log('[PERFORM DRAW] Suppression des participants de la table active...')
    await supabase.from('participants').delete().not('id', 'is', null)

    console.log('[PERFORM DRAW] Tirage terminé avec succès !')

    return res.status(200).json({
      success: true,
      winner: winnerData,
      allParticipants: participants,
      newParticipantsAdded: firstTimeParticipants.length,
      message: 'Tirage effectué avec succès - Protection anti-doublons renforcée'
    })

  } catch (error) {
    console.error('[PERFORM DRAW] Erreur tirage:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    
    // 🔧 AMÉLIORATION : Log détaillé en cas d'erreur critique
    console.error('[PERFORM DRAW] Stack trace:', error instanceof Error ? error.stack : 'N/A')
    console.error('[PERFORM DRAW] Contexte - Heure:', new Date().toISOString())
    
    return res.status(500).json({ error: errorMessage })
  } finally {
    // 🔧 NOUVEAU : Toujours libérer le verrou avec timeout de sécurité
    drawInProgress = false
    console.log('[PERFORM DRAW] Verrou de tirage libéré')
    
    // 🔧 SÉCURITÉ : Timeout de sécurité pour éviter les blocages permanents
    setTimeout(() => {
      if (drawInProgress) {
        console.warn('[PERFORM DRAW] ⚠️ SÉCURITÉ: Libération forcée du verrou après timeout')
        drawInProgress = false
      }
    }, 30000) // 30 secondes de timeout
  }
}