-- Script pour activer Realtime sur la table winners avec les bonnes politiques RLS

-- 🔧 ÉTAPE 1 : S'assurer que RLS est activé sur la table winners
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- 🔧 ÉTAPE 2 : Supprimer les anciennes politiques si elles existent (pour éviter les conflits)
DO $$
BEGIN
    -- Supprimer les politiques existantes s'il y en a
    DROP POLICY IF EXISTS "Allow anon to read winners" ON public.winners;
    DROP POLICY IF EXISTS "Allow authenticated to read winners" ON public.winners;
    DROP POLICY IF EXISTS "Public winners read access" ON public.winners;
    DROP POLICY IF EXISTS "System can insert winners" ON public.winners;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignorer les erreurs si les politiques n'existent pas
END
$$;

-- 🔧 ÉTAPE 3 : Créer des politiques RLS appropriées pour Realtime

-- Politique pour permettre la lecture publique des gagnants (pour Realtime)
CREATE POLICY "Public winners read access"
ON public.winners
FOR SELECT
TO anon, authenticated
USING (true);

-- Politique pour permettre l'insertion des gagnants par le système (API)
CREATE POLICY "System can insert winners"
ON public.winners
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- 🔧 ÉTAPE 4 : Activer Realtime sur la table winners
-- Cette commande active la réplication pour Realtime
ALTER publication supabase_realtime ADD TABLE public.winners;

-- 🔧 ÉTAPE 5 : Vérifier la configuration
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled",
    (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'winners'
    ) as "Number of Policies"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'winners';

-- 🔧 ÉTAPE 6 : Vérifier que la table est dans la publication Realtime
SELECT 
    pub.pubname as "Publication Name",
    string_agg(
        quote_ident(schemaname) || '.' || quote_ident(tablename), 
        ', '
    ) as "Tables"
FROM pg_publication pub
LEFT JOIN pg_publication_tables pt ON pub.pubname = pt.pubname
WHERE pub.pubname = 'supabase_realtime'
GROUP BY pub.pubname;

-- Message de confirmation
SELECT '✅ Configuration Realtime terminée pour la table winners !' as "Status"; 