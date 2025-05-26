import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'

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

  const handlePseudoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Supprime les espaces et le @ s'il est entré manuellement
    const value = e.target.value.replace(/\s+/g, '').replace('@', '')
    setFormData({...formData, pseudoInstagram: value})
  }

  const getNextDrawDate = () => {
    const now = new Date()
    const day = now.getDay() // 0 = dimanche, 3 = mercredi
    const hours = now.getHours()
    let nextDate = new Date()
    
    if (day < 0 || (day === 0 && hours >= 20)) {
      // Prochain mercredi
      nextDate.setDate(nextDate.getDate() + ((3 + 7 - day) % 7))
    } else if (day < 3 || (day === 3 && hours >= 20)) {
      // Prochain dimanche
      nextDate.setDate(nextDate.getDate() + ((0 + 7 - day) % 7))
    } else {
      // Prochain dimanche
      nextDate.setDate(nextDate.getDate() + ((0 + 7 - day) % 7))
    }
    
    nextDate.setHours(20, 0, 0, 0)
    return nextDate
  }

  const isRegistrationOpen = () => {
    const now = new Date()
    const drawDate = getNextDrawDate()
    const timeUntilDraw = drawDate.getTime() - now.getTime()
    const fiveMinutesInMs = 5 * 60 * 1000

    return timeUntilDraw > fiveMinutesInMs
  }

  const isValidSwissNPA = (npa: string) => {
    // Les NPA suisses sont des nombres entre 1000 et 9999
    const npaNum = parseInt(npa);
    return !isNaN(npaNum) && npaNum >= 1000 && npaNum <= 9999;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
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
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
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

      // Insérer le nouveau participant
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

      // Redirection en cas de succès
      router.push('/tirage')
    } catch (err) {
      console.error('Erreur générale:', err)
      setError('Une erreur est survenue lors de l\'inscription')
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
              Je confirme être abonné à @SwissTimbo
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