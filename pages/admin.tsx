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
  const [currentPage, setCurrentPage] = useState(1)
  
  // 📊 NOUVEAU: États pour les statistiques
  const [stats, setStats] = useState({
    currentParticipants: 0,
    totalHistoryParticipants: 0,
    totalWinners: 0,
    loading: true
  })
  
  const ITEMS_PER_PAGE = 50
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
      // Mettre à jour les stats des participants actuels
      setStats(prev => ({ ...prev, currentParticipants: data.length }))
    }
  }

  // 📊 NOUVEAU: Fonction pour récupérer toutes les statistiques
  const fetchStats = async () => {
    setStats(prev => ({ ...prev, loading: true }))
    
    try {
      // Compter les participants actuels
      const { count: currentCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact' })

      // Compter l'historique total (participants uniques)
      const { count: historyCount } = await supabase
        .from('participants_history')
        .select('*', { count: 'exact' })

      // Compter le nombre total de gagnants
      const { count: winnersCount } = await supabase
        .from('winners')
        .select('*', { count: 'exact' })

      setStats({
        currentParticipants: currentCount || 0,
        totalHistoryParticipants: historyCount || 0,
        totalWinners: winnersCount || 0,
        loading: false
      })
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  const fetchHistory = async (page = 1) => {
    const from = (page - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    const { data, error, count } = await supabase
      .from('participants_history')
      .select('*', { count: 'exact' })
      .order('draw_date', { ascending: false })
      .range(from, to)

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
      fetchStats() // 📊 NOUVEAU: Récupérer les stats au chargement
    }
  }, [isAuthenticated])

  // 📊 NOUVEAU: Fonction pour actualiser les statistiques
  const refreshStats = () => {
    fetchStats()
    fetchParticipants()
    fetchHistory()
  }

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

        {/* 📊 NOUVEAU: Tableau de bord des statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Participants actuels */}
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-dollar-green">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Participants actuels</p>
                <p className="text-2xl font-bold text-dollar-green">
                  {stats.loading ? '...' : stats.currentParticipants}
                </p>
                <p className="text-xs text-gray-500">
                  Places restantes: {stats.loading ? '...' : (1000 - stats.currentParticipants)}
                </p>
              </div>
              <div className="text-dollar-green">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Historique total */}
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Historique total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.loading ? '...' : stats.totalHistoryParticipants}
                </p>
                <p className="text-xs text-gray-500">Participations passées</p>
              </div>
              <div className="text-blue-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Total des gagnants */}
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total gagnants</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.loading ? '...' : stats.totalWinners}
                </p>
                <p className="text-xs text-gray-500">Tirages effectués</p>
              </div>
              <div className="text-yellow-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Bouton d'actualisation */}
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-gray-400">
            <div className="flex flex-col items-center justify-center h-full">
              <button
                onClick={refreshStats}
                disabled={stats.loading}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition flex items-center space-x-2"
              >
                <svg className={`w-4 h-4 ${stats.loading ? 'animate-spin' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                </svg>
                <span>{stats.loading ? 'Actualisation...' : 'Actualiser'}</span>
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">Mettre à jour les statistiques</p>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex mb-6 border-b">
          <button
            className={`py-2 px-4 ${activeTab === 'participants' ? 'border-b-2 border-dollar-green font-bold' : ''}`}
            onClick={() => setActiveTab('participants')}
          >
            Participants actuels ({stats.currentParticipants})
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'history' ? 'border-b-2 border-dollar-green font-bold' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Historique complet ({stats.totalHistoryParticipants})
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
      </div>
    </Layout>
  )
} 