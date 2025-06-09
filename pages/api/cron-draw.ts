import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 🔧 AMÉLIORATION : Vérification plus stricte de l'authentification
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization
  
  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET n\'est pas défini dans les variables d\'environnement')
    return res.status(500).json({ error: 'Configuration serveur manquante' })
  }
  
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    console.log('[CRON] Tentative d\'accès non autorisée')
    console.log('[CRON] Auth header reçu:', authHeader ? '[PRÉSENT MAIS INCORRECT]' : '[MANQUANT]')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // 🔧 NOUVEAU : Log d'information sur le déclenchement
  console.log('[CRON] 🕐 Tirage CRON déclenché à:', new Date().toISOString())
  console.log('[CRON] 📍 Jour de la semaine:', new Date().getDay()) // 0 = dimanche, 3 = mercredi
  console.log('[CRON] ⏰ Heure actuelle:', `${new Date().getHours()}h${new Date().getMinutes().toString().padStart(2, '0')}`)
  console.log('[CRON] 🎯 Tirage attendu: Dimanche et Mercredi à 20h00 pile')

  try {
    // 🔧 AMÉLIORATION : Rediriger vers l'API centralisée qui a la logique anti-doublons renforcée
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    console.log('[CRON] 🔄 Appel de l\'API centralisée:', `${baseUrl}/api/perform-draw`)
    
    const response = await fetch(`${baseUrl}/api/perform-draw`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`,
        'User-Agent': 'CRON-System'
      }
    })

    const result = await response.json()
    
    if (result.success) {
      console.log(`[CRON] ✅ Tirage réussi via API centralisée`)
      console.log(`[CRON] 🏆 Gagnant: ${result.winner.pseudoinstagram}`)
      console.log(`[CRON] 📊 Participants total: ${result.allParticipants.length}`)
      console.log(`[CRON] 🆕 Nouveaux participants ajoutés à l'historique: ${result.newParticipantsAdded}`)
      console.log(`[CRON] 💬 Message: ${result.message}`)
    } else {
      console.log(`[CRON] ⚠️ Tirage non effectué: ${result.error}`)
      if (result.todayWinners) {
        console.log('[CRON] 📋 Gagnants déjà présents aujourd\'hui:', result.todayWinners.length)
      }
    }

    // 🔧 AMÉLIORATION : Toujours retourner le statut exact de l'API centralisée
    return res.status(response.status).json({
      ...result,
      cronTimestamp: new Date().toISOString(),
      cronInfo: {
        dayOfWeek: new Date().getDay(),
        hour: new Date().getHours(),
        minutes: new Date().getMinutes(),
        isValidDrawTime: (new Date().getDay() === 0 || new Date().getDay() === 3) && 
                         new Date().getHours() === 20 && 
                         new Date().getMinutes() >= 0 && 
                         new Date().getMinutes() <= 2
      }
    })
  } catch (error) {
    console.error('[CRON] ❌ Erreur lors de l\'appel API centralisée:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return res.status(500).json({ 
      error: errorMessage,
      cronTimestamp: new Date().toISOString(),
      details: 'Échec de l\'appel vers l\'API perform-draw'
    })
  }
} 