-- 🆕 Table pour tracker les sessions d'utilisateurs actifs
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    current_page VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index pour optimiser les requêtes de nettoyage et comptage
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity 
ON active_sessions(last_activity);

CREATE INDEX IF NOT EXISTS idx_active_sessions_session_id 
ON active_sessions(session_id);

-- 🔧 Politique de sécurité : Permettre les opérations publiques sur cette table
-- (car il n'y a pas de données sensibles et c'est nécessaire pour le tracking)
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre les INSERT
CREATE POLICY "allow_insert_sessions" 
ON active_sessions FOR INSERT 
WITH CHECK (true);

-- Politique pour permettre les UPDATE
CREATE POLICY "allow_update_sessions" 
ON active_sessions FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Politique pour permettre les DELETE (pour le nettoyage)
CREATE POLICY "allow_delete_sessions" 
ON active_sessions FOR DELETE 
USING (true);

-- Politique pour permettre les SELECT (pour le comptage)
CREATE POLICY "allow_select_sessions" 
ON active_sessions FOR SELECT 
USING (true); 