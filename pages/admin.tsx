import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'
import { Participant } from '@/types'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  const ADMIN_PASSWORD = 'admin123' // À changer pour un vrai mot de passe

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      fetchParticipants()
    } else {
      setError('Mot de passe incorrect')
    }
  }

  const fetchParticipants = async () => {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setParticipants(data)
    }
  }

  const filteredParticipants = participants.filter(participant => 
    participant.pseudoInstagram.toLowerCase().includes(searchTerm.toLowerCase()) ||
    participant.nom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const exportToCSV = () => {
    const headers = ['Nom', 'Âge', 'Pseudo Instagram', 'Date d\'inscription']
    const csvData = filteredParticipants.map(p => 
      `${p.nom},${p.age},${p.pseudoInstagram},${new Date(p.created_at).toLocaleDateString()}`
    )
    
    const csv = [headers.join(','), ...csvData].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'participants.csv'
    a.click()
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Administration</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-dollar-green text-white py-2 rounded hover:bg-opacity-90"
            >
              Se connecter
            </button>
          </form>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Liste des participants</h1>
          <button
            onClick={exportToCSV}
            className="bg-dollar-green text-white px-4 py-2 rounded hover:bg-opacity-90"
          >
            Exporter CSV
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher un participant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Âge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pseudo Instagram
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'inscription
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredParticipants.map((participant) => (
                <tr key={participant.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{participant.nom}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{participant.age}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{participant.pseudoInstagram}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(participant.created_at).toLocaleDateString()}
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