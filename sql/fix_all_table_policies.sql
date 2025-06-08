-- 🔧 Script complet pour corriger toutes les politiques de sécurité
-- Résout les erreurs 406 sur toutes les tables

-- =================================
-- 🏆 TABLE WINNERS
-- =================================
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_select_winners" ON winners;
CREATE POLICY "allow_select_winners" 
ON winners FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "allow_insert_winners" ON winners;
CREATE POLICY "allow_insert_winners" 
ON winners FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "allow_update_winners" ON winners;
CREATE POLICY "allow_update_winners" 
ON winners FOR UPDATE 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "allow_delete_winners" ON winners;
CREATE POLICY "allow_delete_winners" 
ON winners FOR DELETE 
USING (true);

-- =================================
-- 👥 TABLE PARTICIPANTS
-- =================================
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_select_participants" ON participants;
CREATE POLICY "allow_select_participants" 
ON participants FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "allow_insert_participants" ON participants;
CREATE POLICY "allow_insert_participants" 
ON participants FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "allow_update_participants" ON participants;
CREATE POLICY "allow_update_participants" 
ON participants FOR UPDATE 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "allow_delete_participants" ON participants;
CREATE POLICY "allow_delete_participants" 
ON participants FOR DELETE 
USING (true);

-- =================================
-- 📚 TABLE PARTICIPANTS_HISTORY
-- =================================
ALTER TABLE participants_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_select_participants_history" ON participants_history;
CREATE POLICY "allow_select_participants_history" 
ON participants_history FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "allow_insert_participants_history" ON participants_history;
CREATE POLICY "allow_insert_participants_history" 
ON participants_history FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "allow_update_participants_history" ON participants_history;
CREATE POLICY "allow_update_participants_history" 
ON participants_history FOR UPDATE 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "allow_delete_participants_history" ON participants_history;
CREATE POLICY "allow_delete_participants_history" 
ON participants_history FOR DELETE 
USING (true);

-- =================================
-- ✅ VÉRIFICATIONS
-- =================================

-- Vérifier toutes les politiques créées
SELECT 
    'Politiques créées:' as info,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('winners', 'participants', 'participants_history', 'active_sessions')
ORDER BY tablename, policyname;

-- Tests de lecture pour vérifier que tout fonctionne
SELECT 'Test winners:' as test, COUNT(*) as count FROM winners
UNION ALL
SELECT 'Test participants:' as test, COUNT(*) as count FROM participants
UNION ALL
SELECT 'Test participants_history:' as test, COUNT(*) as count FROM participants_history
UNION ALL
SELECT 'Test active_sessions:' as test, COUNT(*) as count FROM active_sessions; 