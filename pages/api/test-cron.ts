import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 🧪 ENDPOINT DE TEST pour diagnostiquer le système CRON
  
  console.log('[TEST-CRON] 🧪 Diagnostic du système CRON')
  
  // Vérifier les variables d'environnement
  const cronSecret = process.env.CRON_SECRET
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  
  console.log('[TEST-CRON] 🔐 CRON_SECRET défini:', cronSecret ? 'OUI' : 'NON')
  console.log('[TEST-CRON] 🌐 SITE_URL:', siteUrl || 'NON DÉFINI')
  
  if (!cronSecret) {
    return res.status(500).json({
      error: '❌ CRON_SECRET manquant',
      solution: 'Ajouter CRON_SECRET dans les variables d\'environnement Vercel',
      status: 'ÉCHEC'
    })
  }
  
  // Simuler un appel CRON
  try {
    const baseUrl = siteUrl || 'http://localhost:3000'
    
    console.log('[TEST-CRON] 🔄 Test d\'appel vers:', `${baseUrl}/api/cron-draw`)
    
    const response = await fetch(`${baseUrl}/api/cron-draw`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`,
        'User-Agent': 'TEST-Manual'
      }
    })
    
    const result = await response.json()
    
    console.log('[TEST-CRON] 📊 Statut réponse:', response.status)
    console.log('[TEST-CRON] 📊 Résultat:', result)
    
    return res.status(200).json({
      status: 'SUCCÈS',
      cronSecret: cronSecret ? 'DÉFINI' : 'MANQUANT',
      siteUrl: siteUrl || 'DÉFAUT: localhost',
      apiResponse: {
        status: response.status,
        body: result
      },
      diagnostic: response.status === 200 ? '✅ CRON fonctionne' : '⚠️ Problème détecté',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[TEST-CRON] ❌ Erreur lors du test:', error)
    
    return res.status(500).json({
      status: 'ERREUR',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      diagnostic: '❌ Échec de communication avec l\'API CRON',
      timestamp: new Date().toISOString()
    })
  }
} 