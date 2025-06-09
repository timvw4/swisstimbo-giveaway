-- 🔧 Script pour corriger les erreurs 406 sur la table participants
-- Supprime toutes les politiques existantes et en crée de nouvelles simples

-- Désactiver temporairement RLS pour nettoyer
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;

-- 🔧 Supprimer TOUTES les politiques existantes sur participants
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

-- Réactiver RLS
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Créer des politiques simples et permissives
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

-- ✅ Vérifier que les politiques sont créées
SELECT 
    'Politiques participants créées:' as info,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'participants'
ORDER BY policyname;

-- Test de lecture
SELECT 
    'Test participants:' as test, 
    COUNT(*) as count 
FROM participants;

SELECT '✅ CORRECTION PARTICIPANTS TERMINÉE - Les erreurs 406 sur participants devraient être résolues !' as statut; 