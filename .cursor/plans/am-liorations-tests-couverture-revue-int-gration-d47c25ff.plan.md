<!-- d47c25ff-cd7f-4cb7-8841-3584b33cb8da 493519e9-e275-446e-bbbe-6183dd43a273 -->
# Plan d'amélioration - Tests d'intégration et couverture (Harmonisation complète)

## Objectif

Implémenter les améliorations identifiées lors des revues validées (2025-11-02) : appliquer les améliorations globales (1:1) et les principes généraux identifiés lors de la revue en profondeur à tous les tests d'intégration, puis ajuster les règles de gouvernance.

## Contexte

- **Analyses validées** :
- Analyse de couverture de tests : `.cursor/executed-plans/2025-11-02-analyse-couverture-tests.md` (portant sur l'ensemble des tests)
- Revue en profondeur : `.cursor/executed-plans/2025-11-02-revue-profondeur-test-integration-mise-a-jour-template.md` (un seul scénario)

- **Documentation officielle** : `nuextract-platform.yaml` (OpenAPI 3.1.0, l.742-835)

**Note importante** :

- Analyse de couverture : améliorations identifiées globalement et **applicables 1:1** à l'ensemble
- Revue en profondeur : principes généraux identifiés sur un seul scénario mais **applicables à tous les tests d'intégration**

## Phase 1 : Validation métier complète (Haute priorité)

### 1.1 Créer fonction `getNuExtractProject()` dans `nuextract-api.js`

**Fichier** : `hermes2022-concepts-site-extraction/src/nuextract-api.js`

**Action** : Ajouter fonction `getNuExtractProject()` selon pattern existant `getNuExtractProjects()`

**Documentation officielle** : `GET /api/projects/{projectId}` (nuextract-platform.yaml, l.742-835)

- Endpoint : `GET /api/projects/{projectId}`
- Réponse : `ProjectResponse` contenant le champ `template` (l.781-813)

**Path configuration** : ✅ Aucun ajout nécessaire - utilise le même `projectsPath`

### 1.2 Implémenter assertion métier dans `.steps.ts`

**Fichier** : `hermes2022-concepts-site-extraction/__tests__/integration/with-external-system/nuextract-project-management.steps.ts`

**Action** : Remplacer l'assertion redondante (l.168-170) par validation métier complète avec `getNuExtractProject()` selon documentation officielle

## Phase 2 : Nettoyage redondances (Moyenne priorité)

### 2.1 Supprimer assertion redondante "ID projet inchangé"

**Fichiers** :

- `hermes2022-concepts-site-extraction/__tests__/integration/with-external-system/nuextract-project-management.steps.ts` (l.172-174)
- `hermes2022-concepts-site-extraction/__tests__/integration/with-external-system/nuextract-project-management.feature` (l.22)

## Phase 3 : Optimisation assertion défensive (Basse priorité, optionnel)

### 3.1 Optimiser assertion défensive

**Fichier** : `hermes2022-concepts-site-extraction/__tests__/integration/with-external-system/nuextract-project-management.steps.ts` (l.163-166)

## Phase 4 : Vérification consolidation loadInstructions (Moyenne priorité)

### 4.1 Vérifier la diminution de couverture loadInstructions

**Fichier** : `hermes2022-concepts-site-extraction/__tests__/unit/nuextract-client-error-handling.feature`

**Action** : Comparer scénarios version 31.10 vs actuelle pour vérifier que la diminution (3 → 2 scénarios) n'a pas causé de perte de couverture critique

**Source** : Analyse de couverture de tests (Section 4.3, l.160-162)

## Phase 5 : Harmonisation de tous les tests d'intégration (Haute priorité)

### 5.1 Appliquer les améliorations identifiées globalement (analyse de couverture)

**Objectif** : Appliquer les améliorations identifiées lors de l'analyse de couverture qui portent sur l'ensemble des tests et sont **applicables 1:1**

**Source** : Analyse de couverture de tests (2025-11-02)

- Section 4.3 : Recommandations prioritaires d'amélioration

**Améliorations identifiées globalement** :

- Vérification consolidation loadInstructions (Phase 4) - déjà couvert
- Autres améliorations globales identifiées dans l'analyse de couverture (si applicables)

**Action** : Appliquer directement les améliorations identifiées globalement selon l'analyse de couverture

### 5.2 Appliquer les principes d'amélioration identifiés lors de la revue en profondeur

**Objectif** : Appliquer les principes généraux identifiés lors de la revue en profondeur d'un seul scénario à l'ensemble des tests d'intégration

**Source** : Revue en profondeur (2025-11-02, Section 3.1 - Améliorations générales méthodologie BDD)

- **Note** : La revue en profondeur a été effectuée sur un seul scénario, mais les améliorations identifiées sont des **principes généraux applicables à tous les tests d'intégration**, pas des corrections spécifiques au scénario revu

**Principes identifiés à appliquer généralement** :

1. **Distinction validation technique vs métier** (haute priorité) : Clarifier la différence entre validation d'exécution (status retourné) et validation métier (résultat réel sur système externe)
2. **Principe de non-redondance** (moyenne priorité) : Éviter assertions redondantes entre Given et Then
3. **Profondeur assertions Then** (moyenne priorité) : S'assurer que les assertions Then valident l'intention métier, pas seulement la présence de variables

**Tests concernés** (tous les tests d'intégration) :

1. `integration/with-external-system/template-generation.feature` + `.steps.ts` (2 scénarios)
2. `integration/with-external-system/nuextract-project-management.feature` + `.steps.ts` (3 scénarios - 1 déjà corrigé en Phase 1, 2 autres à corriger)
3. `integration/with-external-system-mocked/template-generation-mocked.feature` + `.steps.ts` (4 scénarios)
4. `integration/with-external-system-mocked/nuextract-project-management-mocked.feature` + `.steps.ts` (2 scénarios)

**Actions par test** (application des principes, pas nouvelle analyse) :

1. Identifier les assertions `then()` et `and()` qui nécessitent ajustement selon les principes identifiés
2. Appliquer les corrections selon les principes validés (pas de nouvelle analyse approfondie)
3. Vérifier cohérence avec les principes : distinction technique/métier, non-redondance, profondeur métier

**Référence** : Conclusions validées de la revue en profondeur (2025-11-02, Section 3.1) - principes généraux à appliquer à l'ensemble des tests d'intégration

## Phase 6 : Vérification et ajustement des règles de gouvernance (Haute priorité)

### 6.1 Vérifier et ajuster `bdd-governance.mdc`

**Fichier** : `cursor-ws-hermes2022-to-archimate/.cursor/rules/new-for-testing/bdd-governance.mdc`

**Action** : Ajouter sections sur les principes identifiés lors de la revue en profondeur

**Sections à ajouter** :

- Distinction validation technique vs validation métier (avec exemples selon conclusions validées)
- Principe de non-redondance entre Given et Then (avec anti-patterns selon conclusions validées)
- Profondeur des assertions Then (avec anti-patterns et solutions selon conclusions validées)

### 6.2 Vérifier et ajuster `jest-cucumber-governance.mdc`

**Fichier** : `cursor-ws-hermes2022-to-archimate/.cursor/rules/new-for-testing/jest-cucumber-governance.mdc`

**Action** : Ajouter si nécessaire sections sur principes de validation métier pour tests d'intégration réels selon conclusions validées

### 6.3 Vérifier et ajuster `test-mock-governance.mdc`

**Fichier** : `cursor-ws-hermes2022-to-archimate/.cursor/rules/new-for-testing/test-mock-governance.mdc`

**Action** : Ajouter si nécessaire clarifications sur tests d'intégration réels (pas de mocks pour fonctions internes) selon conclusions validées

### 6.4 Mettre à jour les dates de dernière mise à jour

**Action** : Mettre à jour conformément à `@current-date-awareness.mdc` dans toutes les règles de gouvernance modifiées

## Validation et tests

### Tests à exécuter après implémentation

1. **Tests d'intégration** : `npm test -- --testPathPatterns="integration"`

- Valider harmonisation complète selon principes appliqués

2. **Tests unitaires** : `npm test -- --testPathPatterns="unit"`

- Valider que tous les tests continuent de passer

## Références

- **Analyses validées** :
- `.cursor/executed-plans/2025-11-02-analyse-couverture-tests.md` (améliorations globales applicables 1:1)
- `.cursor/executed-plans/2025-11-02-revue-profondeur-test-integration-mise-a-jour-template.md` (principes généraux Section 3.1)
- **Documentation officielle API** : `hermes2022-concepts-site-extraction/.cursor/rules/nuextract-platform.yaml` (OpenAPI 3.1.0)
- **Gouvernances** :
- `@bdd-governance.mdc` : Principes BDD (à ajuster)
- `@error-handling-governance.mdc` : Patterns gestion d'erreurs
- `@test-mock-governance.mdc` : Isolation tests (à vérifier)
- `@jest-cucumber-governance.mdc` : Pratiques Jest-Cucumber (à vérifier)
- `@agent-ai-generation-governance.mdc` : Utilisation exclusive de références officielles vérifiées

### To-dos

- [ ] Créer fonction getProjectTemplate() dans nuextract-api.js selon pattern existant (getNuExtractProjects, putProjectTemplate) avec gestion erreurs HTTP/timeout/JSON
- [ ] Ajouter getProjectTemplate dans module.exports de nuextract-api.js
- [ ] Ajouter import getProjectTemplate dans nuextract-project-management.steps.ts
- [ ] Remplacer assertion redondante (l.168-170) par validation métier complète avec getProjectTemplate() et comparaison profonde avec newTemplate
- [ ] Supprimer assertion redondante 'l\'ID du projet reste inchangé' dans .steps.ts (l.172-174)
- [ ] Supprimer step 'Et l\'ID du projet reste inchangé' dans .feature (l.22)
- [ ] Optimiser assertion défensive dans then('le template est mis à jour avec succès') en remplaçant expect(updateResult).toBeDefined() + expect(updateResult.updated).toBe(true) par expect(updateResult?.updated).toBe(true)
- [ ] Vérifier que la diminution de couverture loadInstructions (3 → 2 scénarios) n'a pas causé de perte de couverture critique en comparant scénarios version 31.10 vs actuelle
- [ ] Exécuter tests d'intégration : npm test -- --testPathPatterns='nuextract-project-management' pour valider validation métier complète
- [ ] Exécuter tests unitaires : npm test -- --testPathPatterns='error-handling' pour valider que tous les tests continuent de passer