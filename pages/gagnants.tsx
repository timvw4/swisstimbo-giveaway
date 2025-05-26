import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'

interface Winner {
  id: string
  pseudo_instagram: string
  draw_date: string
  montant: number
}

export default function Gagnants() {
  const [winners, setWinners] = useState<Winner[]>([])

  useEffect(() => {
    const fetchWinners = async () => {
      const { data, error } = await supabase
        .from('winners')
        .select('*')
        .order('draw_date', { ascending: false })

      if (error) {
        console.error('Erreur lors de la récupération des gagnants:', error)
        return
      }

      if (data) {
        setWinners(data)
      }
    }

    fetchWinners()
  }, [])

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-center">
          Historique des Gagnants
        </h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pseudo Instagram
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date du tirage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant gagné
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {winners.map((winner) => (
                <tr key={winner.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {winner.pseudo_instagram}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(winner.draw_date).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {winner.montant} CHF
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
} 