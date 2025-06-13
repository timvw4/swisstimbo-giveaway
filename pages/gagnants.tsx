import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'

interface Winner {
  id: string
  pseudoinstagram: string
  draw_date: string
  montant: number
}

export default function Gagnants() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [totalParticipants, setTotalParticipants] = useState<number>(0)
  const [totalAmountGiven, setTotalAmountGiven] = useState<number>(0)

  // Fonction pour formater la date
  const formatDrawDate = (dateString: string) => {
    const date = new Date(dateString)
    const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
    const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    
    return `${jours[date.getDay()]} ${date.getDate()} ${mois[date.getMonth()]} ${date.getFullYear()}`
  }

  useEffect(() => {
    const fetchData = async () => {
      // Récupérer les gagnants
      const { data: winnersData, error: winnersError } = await supabase
        .from('winners')
        .select('*')
        .order('draw_date', { ascending: false })

      if (winnersError) {
        console.error('Erreur lors de la récupération des gagnants:', winnersError)
        return
      }

      if (winnersData) {
        setWinners(winnersData)
        // Calculer le montant total donné
        const total = winnersData.reduce((sum, winner) => sum + winner.montant, 0)
        setTotalAmountGiven(total)
      }

      // Récupérer le nombre total de participants
      const { count, error: participantsError } = await supabase
        .from('participants_history')
        .select('*', { count: 'exact', head: true })

      if (participantsError) {
        console.error('Erreur lors de la récupération du nombre de participants:', participantsError)
        return
      }

      if (count !== null) {
        setTotalParticipants(count)
      }
    }

    fetchData()
  }, [])

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-center">
          Historique des Gagnants
        </h1>

        {/* Statistiques générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-r from-dollar-green to-green-600 rounded-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Total des participants</h3>
            <p className="text-3xl font-bold">{totalParticipants.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-r from-dollar-green to-yellow-600 rounded-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Montant total distribué</h3>
            <p className="text-3xl font-bold">{totalAmountGiven.toLocaleString()} CHF</p>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-dollar-green rounded-t-lg">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tl-lg">
                      Pseudo Instagram
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Montant gagné
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider rounded-tr-lg">
                      Date du tirage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {winners.map((winner) => (
                    <tr key={winner.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {winner.pseudoinstagram}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {winner.montant} CHF
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-gray-500 min-w-[120px] whitespace-pre-line break-words">
                        {formatDrawDate(winner.draw_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 