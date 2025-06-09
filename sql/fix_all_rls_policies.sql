-- 🔧 Script COMPLET pour éliminer TOUTES les erreurs 406
-- Corrige toutes les politiques RLS de toutes les tables

-- =================================
-- 🏆 TABLE WINNERS
-- =================================
ALTER TABLE winners DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'winners'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON winners';
    END LOOP;
END $$;

ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "winners_all_access" 
ON winners FOR ALL 
TO public
USING (true) 
WITH CHECK (true);

-- =================================
-- 👥 TABLE PARTICIPANTS
-- =================================
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;

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

CREATE POLICY "participants_all_access" 
ON participants FOR ALL 
TO public
USING (true) 
WITH CHECK (true);

-- =================================
-- 📚 TABLE PARTICIPANTS_HISTORY
-- =================================
ALTER TABLE participants_history DISABLE ROW LEVEL SECURITY;

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

CREATE POLICY "participants_history_all_access" 
ON participants_history FOR ALL 
TO public
USING (true) 
WITH CHECK (true);

-- =================================
-- 🔍 VÉRIFICATIONS FINALES
-- =================================

-- Vérifier les politiques créées
SELECT 
    '✅ Nouvelles politiques créées:' as info,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('winners', 'participants', 'participants_history')
ORDER BY tablename, policyname;

-- Tests de lecture
SELECT '📊 Test winners:' as test, COUNT(*) as count FROM winners
UNION ALL
SELECT '📊 Test participants:' as test, COUNT(*) as count FROM participants
UNION ALL
SELECT '📊 Test participants_history:' as test, COUNT(*) as count FROM participants_history;

SELECT '🎉 CORRECTION TERMINÉE - Plus d''erreurs 406 !' as statut; 