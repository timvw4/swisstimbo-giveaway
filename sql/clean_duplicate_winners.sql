-- 🧹 Script pour nettoyer les gagnants en double du même tirage
-- et ne garder que le premier gagnant (un participant peut gagner plusieurs tirages différents)

-- 🔍 ÉTAPE 1: Identifier les vrais doublons (même tirage = même heure/minute)
SELECT 
    'Gagnants du même tirage trouvés:' as info,
    id,
    pseudoinstagram,
    draw_date,
    DATE_TRUNC('minute', draw_date) as tirage_moment,
    ROW_NUMBER() OVER (PARTITION BY DATE_TRUNC('minute', draw_date) ORDER BY draw_date ASC) as rang
FROM winners 
WHERE draw_date >= NOW() - INTERVAL '24 hours'
ORDER BY draw_date DESC;

-- 🗑️ ÉTAPE 2: Supprimer seulement les doublons du MÊME TIRAGE (même heure/minute)
WITH doublons_meme_tirage AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY DATE_TRUNC('minute', draw_date) 
            ORDER BY draw_date ASC
        ) as rang
    FROM winners 
    WHERE draw_date >= NOW() - INTERVAL '24 hours'
)
DELETE FROM winners 
WHERE id IN (
    SELECT id FROM doublons_meme_tirage WHERE rang > 1
);

-- 🧹 ÉTAPE 3: Nettoyer l'historique des participants liés aux gagnants supprimés
DELETE FROM participants_history 
WHERE draw_id NOT IN (SELECT id FROM winners);

-- ✅ ÉTAPE 4: Vérifier le résultat (doit montrer 1 gagnant par tirage)
SELECT 
    'Gagnants restants après nettoyage:' as info,
    id,
    pseudoinstagram,
    draw_date,
    DATE_TRUNC('minute', draw_date) as moment_tirage
FROM winners 
WHERE draw_date >= NOW() - INTERVAL '24 hours'
ORDER BY draw_date DESC;

-- 📊 ÉTAPE 5: Vérifier qu'il n'y a plus de doublons du même tirage
SELECT 
    'Vérification des doublons par tirage:' as info,
    DATE_TRUNC('minute', draw_date) as moment_tirage,
    COUNT(*) as nombre_gagnants_ce_tirage
FROM winners 
WHERE draw_date >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('minute', draw_date)
HAVING COUNT(*) > 1;

-- 📊 ÉTAPE 6: Statistiques finales
SELECT 
    'Statistiques finales:' as info,
    (SELECT COUNT(*) FROM winners) as total_gagnants,
    (SELECT COUNT(*) FROM participants_history) as total_historique,
    (SELECT COUNT(*) FROM participants) as participants_actuels; 