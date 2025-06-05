import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vérifier l'authentification
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // 🔧 AMÉLIORATION : Rediriger vers l'API centralisée qui a la logique anti-doublons
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/perform-draw`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    })

    const result = await response.json()
    
    if (result.success) {
      console.log(`[CRON] Tirage réussi via API centralisée - Gagnant: ${result.winner.pseudoinstagram}`)
      console.log(`[CRON] Nouveaux participants ajoutés à l'historique: ${result.newParticipantsAdded}`)
    }

    return res.status(response.status).json(result)
  } catch (error) {
    console.error('[CRON] Erreur lors de l\'appel API centralisée:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return res.status(500).json({ error: errorMessage })
  }
} 