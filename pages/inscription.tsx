import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'

export default function Inscription() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nom: '',
    age: '',
    pseudoInstagram: '',
    isSubscribed: false
  })
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handlePseudoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Supprime les espaces et le @ s'il est entré manuellement
    const value = e.target.value.replace(/\s+/g, '').replace('@', '')
    setFormData({...formData, pseudoInstagram: value})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (parseInt(formData.age) < 18) {
        setError('Vous devez être majeur pour participer')
        setLoading(false)
        return
      }

      // Vérifier si le pseudo existe déjà
      const { data: existingUser, error: checkError } = await supabase
        .from('participants')
        .select('pseudoinstagram')
        .eq('pseudoinstagram', '@' + formData.pseudoInstagram)
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
          nom: formData.nom,
          age: parseInt(formData.age),
          pseudoinstagram: '@' + formData.pseudoInstagram,
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
            <label className="block mb-2 text-sm md:text-base">Nom complet</label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded text-base"
              value={formData.nom}
              onChange={(e) => setFormData({...formData, nom: e.target.value})}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm md:text-base">Âge</label>
            <input
              type="number"
              required
              min="18"
              className="w-full p-3 border rounded text-base"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm md:text-base">Pseudo Instagram</label>
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
            <label className="flex items-center text-sm md:text-base">
              <input
                type="checkbox"
                required
                className="mr-2 w-4 h-4"
                checked={formData.isSubscribed}
                onChange={(e) => setFormData({...formData, isSubscribed: e.target.checked})}
              />
              Je confirme être abonné à @Jacques_reverdin
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