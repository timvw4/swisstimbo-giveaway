-- 🔧 Script complet pour corriger toutes les politiques de sécurité
-- Résout les erreurs 406 sur toutes les tables

-- =================================
-- 🏆 TABLE WINNERS - CORRECTION ERREUR 406
-- =================================
-- Désactiver temporairement RLS pour nettoyer
ALTER TABLE winners DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "allow_select_winners" ON winners;
DROP POLICY IF EXISTS "allow_insert_winners" ON winners;
DROP POLICY IF EXISTS "allow_update_winners" ON winners;
DROP POLICY IF EXISTS "allow_delete_winners" ON winners;
DROP POLICY IF EXISTS "Enable read access for all users" ON winners;
DROP POLICY IF EXISTS "Enable insert for all users" ON winners;

-- Réactiver RLS
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

-- Créer de nouvelles politiques simples et permissives
CREATE POLICY "winners_select_policy" 
ON winners FOR SELECT 
TO public
USING (true);

CREATE POLICY "winners_insert_policy" 
ON winners FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "winners_update_policy" 
ON winners FOR UPDATE 
TO public
USING (true) 
WITH CHECK (true);

CREATE POLICY "winners_delete_policy" 
ON winners FOR DELETE 
TO public
USING (true);

-- =================================
-- 👥 TABLE PARTICIPANTS
-- =================================
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_select_participants" ON participants;
DROP POLICY IF EXISTS "allow_insert_participants" ON participants;
DROP POLICY IF EXISTS "allow_update_participants" ON participants;
DROP POLICY IF EXISTS "allow_delete_participants" ON participants;

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_select_policy" 
ON participants FOR SELECT 
TO public
USING (true);

CREATE POLICY "participants_insert_policy" 
ON participants FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "participants_update_policy" 
ON participants FOR UPDATE 
TO public
USING (true) 
WITH CHECK (true);

CREATE POLICY "participants_delete_policy" 
ON participants FOR DELETE 
TO public
USING (true);

-- =================================
-- 📚 TABLE PARTICIPANTS_HISTORY
-- =================================
ALTER TABLE participants_history DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_select_participants_history" ON participants_history;
DROP POLICY IF EXISTS "allow_insert_participants_history" ON participants_history;
DROP POLICY IF EXISTS "allow_update_participants_history" ON participants_history;
DROP POLICY IF EXISTS "allow_delete_participants_history" ON participants_history;

ALTER TABLE participants_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_history_select_policy" 
ON participants_history FOR SELECT 
TO public
USING (true);

CREATE POLICY "participants_history_insert_policy" 
ON participants_history FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "participants_history_update_policy" 
ON participants_history FOR UPDATE 
TO public
USING (true) 
WITH CHECK (true);

CREATE POLICY "participants_history_delete_policy" 
ON participants_history FOR DELETE 
TO public
USING (true);

-- =================================
-- 💻 TABLE ACTIVE_SESSIONS (si elle existe)
-- =================================
DO $$ 
BEGIN
    -- Vérifier si la table existe avant de modifier ses politiques
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'active_sessions') THEN
        ALTER TABLE active_sessions DISABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "allow_select_active_sessions" ON active_sessions;
        DROP POLICY IF EXISTS "allow_insert_active_sessions" ON active_sessions;
        DROP POLICY IF EXISTS "allow_update_active_sessions" ON active_sessions;
        DROP POLICY IF EXISTS "allow_delete_active_sessions" ON active_sessions;
        
        ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "active_sessions_all_policy" 
        ON active_sessions FOR ALL 
        TO public
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- =================================
-- ✅ VÉRIFICATIONS FINALES
-- =================================

-- Vérifier toutes les politiques créées
SELECT 
    '✅ Politiques créées:' as info,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('winners', 'participants', 'participants_history', 'active_sessions')
ORDER BY tablename, policyname;

-- Tests de lecture pour vérifier que tout fonctionne
SELECT '✅ Test winners:' as test, COUNT(*) as count FROM winners
UNION ALL
SELECT '✅ Test participants:' as test, COUNT(*) as count FROM participants
UNION ALL
SELECT '✅ Test participants_history:' as test, COUNT(*) as count FROM participants_history;

-- Message de confirmation
SELECT '🎉 CORRECTION TERMINÉE - Les erreurs 406 devraient être résolues !' as statut; 