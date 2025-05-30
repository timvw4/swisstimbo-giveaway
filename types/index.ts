export interface Participant {
  id: string
  npa: string
  pseudoinstagram: string
  created_at: string
}

// Interface pour les gagnants (utilisée dans pages/gagnants.tsx et admin.tsx)
export interface Winner {
  id: string
  participant_id: string
  pseudoinstagram: string
  draw_date: string
  montant: number
}

// Interface pour l'historique (utilisée dans pages/admin.tsx)
export interface HistoryEntry {
  id: string
  pseudoinstagram: string
  npa: string
  created_at: string
  draw_date: string
  draw_id: string
}

// Interface pour les props du Countdown (utilisée dans plusieurs pages)
export interface CountdownRenderProps {
  days: number
  hours: number
  minutes: number
  seconds: number
}

// Interface pour les props du PixelGrid
export interface PixelGridProps {
  participants: Participant[]
  previousWinners: string[]
  isSpinning: boolean
  winner: Participant | null
  onStopSpinning: () => void
} 