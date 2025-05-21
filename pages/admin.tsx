import React, { useState } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'
import { Participant } from '@/types'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  const ADMIN_PASSWORD = 'admin.tihf'

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
    participant.pseudoinstagram.toLowerCase().includes(searchTerm.toLowerCase()) ||
    participant.nom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const exportToCSV = () => {
    const headers = ['Nom', 'Âge', 'Pseudo Instagram', 'Date et heure d\'inscription']
    const csvData = filteredParticipants.map(p => 
      `${p.nom},${p.age},${p.pseudoinstagram},${new Date(p.created_at).toLocaleString()}`
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
        <div className="max-w-md mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Administration</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm md:text-base">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm md:text-base">Mot de passe</label>
              <input
                type="password"
                className="w-full p-3 border rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-dollar-green text-white py-3 rounded hover:bg-opacity-90 transition"
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
          <h1 className="text-2xl md:text-3xl font-bold">Liste des participants</h1>
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
            <input
              type="text"
              placeholder="Rechercher..."
              className="p-2 border rounded w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={exportToCSV}
              className="bg-dollar-green text-white px-4 py-2 rounded hover:bg-opacity-90 transition"
            >
              Exporter CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Âge
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Pseudo
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParticipants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-3 md:px-6 py-4 text-sm">{participant.nom}</td>
                    <td className="px-3 md:px-6 py-4 text-sm">{participant.age}</td>
                    <td className="px-3 md:px-6 py-4 text-sm">{participant.pseudoinstagram}</td>
                    <td className="px-3 md:px-6 py-4 text-sm">
                      {new Date(participant.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
} 