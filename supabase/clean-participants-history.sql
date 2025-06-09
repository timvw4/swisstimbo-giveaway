-- Script pour nettoyer les doublons dans participants_history
-- Garde seulement la PREMIÈRE participation de chaque utilisateur (la plus ancienne)

-- 🔧 ÉTAPE 1 : Afficher l'état actuel pour information
SELECT 
    'État AVANT nettoyage:' AS info,
    COUNT(*) AS total_lignes,
    COUNT(DISTINCT pseudoinstagram) AS participants_uniques,
    COUNT(*) - COUNT(DISTINCT pseudoinstagram) AS doublons_a_supprimer
FROM participants_history;

-- 🔧 ÉTAPE 2 : Afficher quelques exemples de doublons
SELECT 
    'Exemples de doublons:' AS info,
    pseudoinstagram,
    COUNT(*) AS nb_participations,
    string_agg(draw_date::text, ', ') AS dates_tirages
FROM participants_history 
GROUP BY pseudoinstagram 
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 5;

-- 🔧 ÉTAPE 3 : Créer une table temporaire avec seulement les premières participations
CREATE TEMP TABLE participants_history_clean AS
SELECT DISTINCT ON (pseudoinstagram)
    id,
    pseudoinstagram,
    npa,
    created_at,
    draw_date,
    draw_id
FROM participants_history
ORDER BY pseudoinstagram, draw_date ASC; -- Garder la participation la plus ancienne

-- 🔧 ÉTAPE 4 : Vérifier le résultat avant suppression
SELECT 
    'État APRÈS nettoyage (aperçu):' AS info,
    COUNT(*) AS total_lignes_propres,
    COUNT(DISTINCT pseudoinstagram) AS participants_uniques
FROM participants_history_clean;

-- 🔧 ÉTAPE 5 : Sauvegarder l'ancienne table (backup)
CREATE TABLE participants_history_backup AS
SELECT * FROM participants_history;

SELECT 'Backup créé dans participants_history_backup' AS info;

-- 🔧 ÉTAPE 6 : Remplacer le contenu de la table principale
DELETE FROM participants_history;

INSERT INTO participants_history (id, pseudoinstagram, npa, created_at, draw_date, draw_id)
SELECT id, pseudoinstagram, npa, created_at, draw_date, draw_id
FROM participants_history_clean;

-- 🔧 ÉTAPE 7 : Vérifier le résultat final
SELECT 
    'État FINAL:' AS info,
    COUNT(*) AS total_lignes,
    COUNT(DISTINCT pseudoinstagram) AS participants_uniques,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT pseudoinstagram) THEN '✅ Aucun doublon'
        ELSE '❌ Des doublons persistent'
    END AS statut_doublons
FROM participants_history;

-- 🔧 ÉTAPE 8 : Afficher quelques exemples du résultat
SELECT 
    'Exemples de données nettoyées:' AS info,
    pseudoinstagram,
    draw_date AS premiere_participation,
    npa
FROM participants_history 
ORDER BY draw_date ASC
LIMIT 10;

-- 🔧 ÉTAPE 9 : Comparer avant/après
SELECT 
    'Résumé du nettoyage:' AS info,
    (SELECT COUNT(*) FROM participants_history_backup) AS lignes_avant,
    (SELECT COUNT(*) FROM participants_history) AS lignes_apres,
    (SELECT COUNT(*) FROM participants_history_backup) - (SELECT COUNT(*) FROM participants_history) AS doublons_supprimes;

-- Message final
SELECT '🎉 Nettoyage terminé ! Vous pouvez maintenant supprimer participants_history_backup si tout est correct.' AS message; 