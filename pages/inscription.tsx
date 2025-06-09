import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'
import { getNextDrawDate, isRegistrationOpen } from '@/utils/dateUtils'

export default function Inscription() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    npa: '',
    pseudoInstagram: '',
    isSubscribed: false,
    isAdult: false
  })
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [placesDisponibles, setPlacesDisponibles] = useState<number | null>(null)

  const handlePseudoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Supprime les espaces et le @ s'il est entré manuellement
    const value = e.target.value.replace(/\s+/g, '').replace('@', '')
    setFormData({...formData, pseudoInstagram: value})
  }

  const isValidSwissNPA = (npa: string) => {
    // Les NPA suisses sont des nombres entre 1000 et 9999
    const npaNum = parseInt(npa);
    return !isNaN(npaNum) && npaNum >= 1000 && npaNum <= 9999;
  }

  // Déplacer la fonction fetchPlacesDisponibles en dehors du useEffect
  const fetchPlacesDisponibles = async () => {
    const { count } = await supabase
      .from('participants')
      .select('*', { count: 'exact' })
    
    if (count !== null) {
      setPlacesDisponibles(1000 - count)
    }
  }

  // useEffect utilise maintenant la fonction définie au-dessus
  useEffect(() => {
    // Première exécution
    fetchPlacesDisponibles()

    // Mettre en place l'intervalle de mise à jour
    const interval = setInterval(fetchPlacesDisponibles, 10000)

    // Nettoyer l'intervalle quand le composant est démonté
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Vérifier le nombre de participants
      const { count } = await supabase
        .from('participants')
        .select('*', { count: 'exact' })
      
      if (count && count >= 1000) {
        setError('Le tirage est complet pour cette session (limite: 1000 participants)')
        setLoading(false)
        return
      }

      // Vérifier si l'inscription est encore ouverte
      if (!isRegistrationOpen()) {
        setError('Les inscriptions sont fermées 5 minutes avant le tirage')
        setLoading(false)
        return
      }

      if (parseInt(formData.npa) < 18) {
        setError('Vous devez être majeur pour participer')
        setLoading(false)
        return
      }

      // Vérifier le NPA
      if (!isValidSwissNPA(formData.npa)) {
        setError('Veuillez entrer un NPA suisse valide (entre 1000 et 9999)')
        setLoading(false)
        return
      }

      // Formater le pseudo Instagram
      const formattedPseudo = formData.pseudoInstagram.startsWith('@') 
        ? formData.pseudoInstagram 
        : '@' + formData.pseudoInstagram

      // Vérifier si le pseudo existe déjà
      const { data: existingUser, error: checkError } = await supabase
        .from('participants')
        .select('pseudoinstagram')
        .eq('pseudoinstagram', formattedPseudo)
        .maybeSingle()

      if (checkError) {
        console.error('Erreur lors de la vérification:', checkError)
        setError('Erreur lors de la vérification du pseudo')
        setLoading(false)
        return
      }

      if (existingUser) {
        setError('Ce pseudo Instagram est déjà inscrit')
        setLoading(false)
        return
      }

      // Insérer uniquement dans la table participants
      const { error: insertError } = await supabase
        .from('participants')
        .insert([{
          npa: formData.npa,
          pseudoinstagram: formattedPseudo,
          created_at: new Date().toISOString()
        }])

      if (insertError) {
        console.error('Erreur lors de l\'insertion:', insertError)
        setError('Une erreur est survenue lors de l\'inscription')
        setLoading(false)
        return
      }

      // Mettre à jour le compteur et rediriger
      await fetchPlacesDisponibles()
      router.push('/tirage')
    } catch (err) {
      console.error('Erreur générale:', err)
      
      // Gestion d'erreur plus spécifique
      if (err instanceof Error) {
        setError(`Une erreur est survenue: ${err.message}`)
      } else {
        setError('Une erreur inattendue est survenue lors de l\'inscription')
      }
    } finally {
      setLoading(false)
    }
  }

  // Si les inscriptions sont fermées, afficher un message
  if (!isRegistrationOpen()) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Inscription au tirage</h1>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p className="text-lg">
              Les inscriptions sont temporairement fermées.
              <br />
              Elles rouvriront après le tirage.
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">Inscription au tirage</h1>
        
        {/* Afficher le compteur de places */}
        {placesDisponibles !== null && (
          <div className="bg-gray-100 p-4 rounded-lg mb-6 text-center">
            <p className="text-lg">
              Places disponibles : <span className="font-bold text-dollar-green">{placesDisponibles}</span> / 1000
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm md:text-base">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div>
            <label className="block mb-2 text-sm md:text-base">Pseudo Instagram (publié en cas de victoire)</label>
            <div className="flex items-center">
              <span className="bg-gray-100 px-3 py-3 border border-r-0 rounded-l text-base">@</span>
              <input
                type="text"
                required
                className="w-full p-3 border border-l-0 rounded-r text-base"
                value={formData.pseudoInstagram}
                onChange={handlePseudoChange}
                placeholder="votre_pseudo"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm md:text-base">NPA (Code postal suisse)</label>
            <input
              type="text"
              required
              pattern="[1-9][0-9]{3}"
              maxLength={4}
              className="w-full p-3 border rounded text-base"
              value={formData.npa}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '')
                setFormData({...formData, npa: value})
              }}
              placeholder="1234"
            />
            <p className="text-sm text-gray-500 mt-1">
              Entrez votre code postal suisse (ex: 1200)
            </p>
          </div>

          <div>
            <label className="flex items-center text-sm md:text-base">
              <input
                type="checkbox"
                required
                className="mr-2 w-4 h-4"
                checked={formData.isAdult}
                onChange={(e) => setFormData({...formData, isAdult: e.target.checked})}
              />
              Je confirme être majeur (18 ans ou plus)
            </label>
          </div>

          <div>
            <label className="flex items-center text-sm md:text-base">
              <input
                type="checkbox"
                required
                className="mr-2 w-4 h-4"
                checked={formData.isSubscribed}
                onChange={(e) => setFormData({...formData, isSubscribed: e.target.checked})}
              />
              Je confirme être abonné à @swiss.timbo
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-dollar-green text-white py-4 rounded text-base md:text-lg font-medium hover:bg-opacity-90 transition"
          >
            {loading ? 'Inscription en cours...' : 'S\'inscrire'}
          </button>
        </form>
      </div>
    </Layout>
  )
} 