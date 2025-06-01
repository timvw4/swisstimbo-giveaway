import React, { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'
import { Participant } from '@/types'

interface HistoryEntry {
  id: string
  pseudoinstagram: string
  npa: string
  created_at: string
  draw_date: string
  draw_id: string
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [activeTab, setActiveTab] = useState<'participants' | 'history'>('participants')
  const [historySearchTerm, setHistorySearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [loadingMaintenance, setLoadingMaintenance] = useState(false)

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

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('participants_history')
      .select('*')
      .order('draw_date', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
      return
    }

    if (data) {
      setHistory(data)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory()
    }
  }, [isAuthenticated])

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const response = await fetch('/api/maintenance')
        const data = await response.json()
        setMaintenanceMode(data.maintenanceMode)
      } catch (error) {
        console.error('Erreur récupération maintenance:', error)
      }
    }

    fetchMaintenanceStatus()
  }, [])

  const filteredParticipants = participants.filter(participant => 
    participant.pseudoinstagram.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const exportToCSV = () => {
    const csvContent = [
      ['Pseudo Instagram', 'NPA', 'Date d\'inscription'].join(','),
      ...participants.map(participant => [
        participant.pseudoinstagram,
        participant.npa,
        new Date(participant.created_at).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'participants.csv'
    a.click()
  }

  // Filtrer l'historique
  const filteredHistory = history.filter(entry => {
    const matchesSearch = entry.pseudoinstagram.toLowerCase().includes(historySearchTerm.toLowerCase())
    const entryDate = new Date(entry.draw_date)
    const isAfterStart = !startDate || entryDate >= new Date(startDate)
    const isBeforeEnd = !endDate || entryDate <= new Date(endDate)
    
    return matchesSearch && isAfterStart && isBeforeEnd
  })

  // Export CSV de l'historique
  const exportHistoryToCSV = () => {
    const csvContent = [
      ['Pseudo Instagram', 'NPA', 'Date d\'inscription', 'Date du tirage'].join(','),
      ...filteredHistory.map(entry => [
        entry.pseudoinstagram,
        entry.npa,
        new Date(entry.created_at).toLocaleDateString('fr-FR'),
        new Date(entry.draw_date).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'historique_participants.csv'
    a.click()
  }

  const toggleMaintenance = async () => {
    setLoadingMaintenance(true)
    try {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !maintenanceMode })
      })

      const data = await response.json()
      if (data.success) {
        setMaintenanceMode(data.maintenanceMode)
        alert(`Mode maintenance ${data.maintenanceMode ? 'activé' : 'désactivé'}`)
      }
    } catch (error) {
      console.error('Erreur toggle maintenance:', error)
      alert('Erreur lors de la modification')
    } finally {
      setLoadingMaintenance(false)
    }
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
        <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-center">
          Administration
        </h1>

        {/* Onglets */}
        <div className="flex mb-6 border-b">
          <button
            className={`py-2 px-4 ${activeTab === 'participants' ? 'border-b-2 border-dollar-green font-bold' : ''}`}
            onClick={() => setActiveTab('participants')}
          >
            Participants actuels
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'history' ? 'border-b-2 border-dollar-green font-bold' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Historique complet
          </button>
        </div>

        {activeTab === 'participants' ? (
          <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
              <h2 className="text-2xl md:text-3xl font-bold">Liste des participants</h2>
              
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Rechercher un pseudo..."
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
          </>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold">Historique des participations</h2>
              
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto mt-4 md:mt-0">
                <input
                  type="text"
                  placeholder="Rechercher un pseudo..."
                  className="p-2 border rounded w-full md:w-64"
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                />

                <button
                  onClick={exportHistoryToCSV}
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
                        Pseudo
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        NPA
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Date d'inscription
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Date du tirage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHistory.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-3 md:px-6 py-4 text-sm">{entry.pseudoinstagram}</td>
                        <td className="px-3 md:px-6 py-4 text-sm">{entry.npa}</td>
                        <td className="px-3 md:px-6 py-4 text-sm">
                          {new Date(entry.created_at).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-3 md:px-6 py-4 text-sm">
                          {new Date(entry.draw_date).toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Mode Maintenance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">
                {maintenanceMode ? 
                  'Le site est actuellement en maintenance' : 
                  'Le site est accessible normalement'
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">
                En mode maintenance, seule la page admin reste accessible
              </p>
            </div>
            <button
              onClick={toggleMaintenance}
              disabled={loadingMaintenance}
              className={`px-4 py-2 rounded font-medium ${
                maintenanceMode 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } disabled:opacity-50`}
            >
              {loadingMaintenance ? 'Chargement...' : 
               maintenanceMode ? 'Désactiver' : 'Activer'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
} 