import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Récupérer le statut de maintenance
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = pas de résultat
        throw error
      }

      const isMaintenanceMode = data?.value === 'true'
      return res.status(200).json({ maintenanceMode: isMaintenanceMode })
    } catch (error) {
      console.error('Erreur récupération maintenance:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  if (req.method === 'POST') {
    // Activer/désactiver le mode maintenance
    const { enabled } = req.body

    try {
      // Vérifier si l'entrée existe déjà
      const { data: existing } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'maintenance_mode')
        .single()

      if (existing) {
        // Mettre à jour
        const { error } = await supabase
          .from('settings')
          .update({ value: enabled.toString() })
          .eq('key', 'maintenance_mode')

        if (error) throw error
      } else {
        // Créer
        const { error } = await supabase
          .from('settings')
          .insert([{
            key: 'maintenance_mode',
            value: enabled.toString()
          }])

        if (error) throw error
      }

      return res.status(200).json({ 
        success: true, 
        maintenanceMode: enabled 
      })
    } catch (error) {
      console.error('Erreur sauvegarde maintenance:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
} 