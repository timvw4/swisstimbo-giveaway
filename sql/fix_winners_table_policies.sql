-- 🔧 Script pour corriger les politiques de sécurité de la table winners
-- Les erreurs 406 indiquent un problème de permissions RLS

-- S'assurer que RLS est activé sur la table winners
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

-- 🔧 Politique pour permettre les SELECT (lecture publique des gagnants)
DROP POLICY IF EXISTS "allow_select_winners" ON winners;
CREATE POLICY "allow_select_winners" 
ON winners FOR SELECT 
USING (true);

-- 🔧 Politique pour permettre les INSERT (nécessaire pour les tirages)
DROP POLICY IF EXISTS "allow_insert_winners" ON winners;
CREATE POLICY "allow_insert_winners" 
ON winners FOR INSERT 
WITH CHECK (true);

-- 🔧 Politique pour permettre les UPDATE (si nécessaire pour les modifications)
DROP POLICY IF EXISTS "allow_update_winners" ON winners;
CREATE POLICY "allow_update_winners" 
ON winners FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- 🔧 Politique pour permettre les DELETE (pour le nettoyage admin)
DROP POLICY IF EXISTS "allow_delete_winners" ON winners;
CREATE POLICY "allow_delete_winners" 
ON winners FOR DELETE 
USING (true);

-- ✅ Vérifier que les politiques sont bien créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'winners'
ORDER BY policyname;

-- 📊 Test de lecture pour vérifier que ça fonctionne
SELECT 
    'Test de lecture winners:' as info,
    COUNT(*) as nombre_gagnants
FROM winners; 