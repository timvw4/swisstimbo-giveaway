-- 🔧 Script complet pour corriger toutes les politiques de sécurité
-- Résout les erreurs 406 sur toutes les tables

-- =================================
-- 🏆 TABLE WINNERS - CORRECTION ERREUR 406
-- =================================
-- Désactiver temporairement RLS pour nettoyer
ALTER TABLE winners DISABLE ROW LEVEL SECURITY;

-- 🔧 CORRECTION : Supprimer TOUTES les politiques existantes de manière complète
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Supprimer toutes les politiques existantes sur la table winners
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'winners'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON winners';
    END LOOP;
END $$;

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

-- 🔧 CORRECTION : Supprimer toutes les politiques participants
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'participants'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON participants';
    END LOOP;
END $$;

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

-- 🔧 CORRECTION : Supprimer toutes les politiques participants_history
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'participants_history'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON participants_history';
    END LOOP;
END $$;

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
        
        -- Supprimer toutes les politiques active_sessions
        DECLARE
            policy_record RECORD;
        BEGIN
            FOR policy_record IN 
                SELECT policyname FROM pg_policies WHERE tablename = 'active_sessions'
            LOOP
                EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON active_sessions';
            END LOOP;
        END;
        
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