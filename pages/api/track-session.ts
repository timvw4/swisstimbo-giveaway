// API pour tracker les sessions d'utilisateurs connectés
import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Enregistrer une nouvelle session
    const { sessionId, page } = req.body

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId requis' })
    }

    try {
      // Enregistrer ou mettre à jour la session avec timestamp actuel
      const { error } = await supabase
        .from('active_sessions')
        .upsert({
          session_id: sessionId,
          last_activity: new Date().toISOString(),
          current_page: page || 'unknown'
        }, {
          onConflict: 'session_id'
        })

      if (error) throw error

      // Nettoyer les sessions inactives (plus de 5 minutes)
      const fiveMinutesAgo = new Date()
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

      await supabase
        .from('active_sessions')
        .delete()
        .lt('last_activity', fiveMinutesAgo.toISOString())

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Erreur lors du tracking de session:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  if (req.method === 'GET') {
    // Récupérer le nombre d'utilisateurs connectés
    try {
      // Compter les sessions actives (moins de 5 minutes)
      const fiveMinutesAgo = new Date()
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

      const { count, error } = await supabase
        .from('active_sessions')
        .select('*', { count: 'exact' })
        .gte('last_activity', fiveMinutesAgo.toISOString())

      if (error) throw error

      return res.status(200).json({ activeUsers: count || 0 })
    } catch (error) {
      console.error('Erreur lors de la récupération des sessions:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
} 