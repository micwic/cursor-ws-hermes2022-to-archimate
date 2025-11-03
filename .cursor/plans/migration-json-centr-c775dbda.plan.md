<!-- c775dbda-d87c-4ac8-a204-5351df710499 641320bd-c974-4869-b47f-cc4cf80d5200 -->
# Migration instructions template vers extraction-config.schema.json

## Contexte

Migration des instructions depuis `instructions-template-nuextract.md` vers schéma JSON Schema `extraction-config.schema.json` qui sera transformé en objet config JSON utilisable dans le code.

**Architecture** :

- **Schéma JSON Schema** (`/config/extraction-config.schema.json`) : Source de paramétrage avec pattern `enum` pour définir toutes les valeurs possibles
- **Transformation schéma → config** : `loadGlobalConfig()` transforme le schéma en objet config JSON via `transformSchemaToConfig()`
- **Pattern enum uniquement** (pas de `default`) :
  - **Pour propriétés simples** (string, boolean, number) : Utiliser `enum[0]` comme valeur par défaut
  - **Pour arrays** : Utiliser `items.enum` (array complet avec toutes les valeurs) comme valeur par défaut
- **Historisation** : Fichier `extraction-config.json` sauvegardé APRÈS extraction dans répertoire des données (fonctionnalité à implémenter)

## Phase 1 : Tests BDD (Rouge) - Principe BDD

Les changements apportés maintiennent le niveau de couverture des tests actuels et les ajustant et en les complétant si nécessaire au nouveau contexte.

### Créer tests unitaires d'erreur pour loadInstructions()

**Fichiers** :

- `__tests__/unit/nuextract-client-error-handling.feature`
- `__tests__/unit/nuextract-client-error-handling.steps.ts`

Scénarios à créer (Rouge) :

- Erreur si `templateTransformationInstructions.instructions` absent de config
- Erreur si `templateTransformationInstructions.instructions` n'est pas un array

### Créer tests unitaires d'erreur pour loadGlobalConfig()

Scénarios à créer (Rouge) dans même fichier :

- Erreur si schéma JSON Schema introuvable
- Erreur si schéma JSON Schema malformé
- Erreur si structure config invalide après transformation
- Erreur si section `nuextract` absente après transformation

### Créer tests d'intégration mockés

**Fichiers** :

- `__tests__/integration/with-external-system-mocked/template-generation-mocked.feature`
- `__tests__/integration/with-external-system-mocked/template-generation-mocked.steps.ts`

Adapter scénarios existants pour nouveau chemin (instructions depuis config JSON).

### Exécuter tests (Rouge)

Vérifier que tous les tests échouent comme attendu (principe BDD Rouge).

## Phase 2 : Créer schéma JSON Schema

### Créer extraction-config.schema.json

**Fichier** : `hermes2022-concepts-site-extraction/config/extraction-config.schema.json`

Structure JSON Schema Draft-07 complète :

- Reprendre TOUS les paramètres existants de `extraction-config.json` actuel
- Ajouter `nuextract.templateTransformationInstructions` avec :
  - `description` (string, maxLength 500, optionnel) avec "Instructions pour la transformation du schéma json en template par et pour le modèle NuExtract.")
  - `instructions` (array avec items.enum contenant les 2 instructions, obligatoire)
- **Pattern enum** (pas de `default`) :
  - **Propriétés simples** (ex: `templateMode`) : `enum` avec valeurs possibles → transformation utilisera `enum[0]`
  - **Arrays** (ex: `instructions`) : `items.enum` avec toutes les valeurs → transformation utilisera array complet `items.enum`

**Exemple pour `templateTransformationInstructions.instructions`** :

```json
{
  "instructions": {
    "type": "array",
    "items": {
      "type": "string",
      "enum": [
        "- transformes le schéma JSON en template NuExtract",
        "- considères les énumérations JSON..."
      ]
    }
  }
}
```

→ Transformation donnera : `instructions: ["- transformes...", "- considères..."]` (array complet)

**Exemple pour propriété simple `templateMode`** :

```json
{
  "templateMode": {
    "type": "string",
    "enum": ["sync", "async"]
  }
}
```

→ Transformation donnera : `templateMode: "sync"` (enum[0])

### Migrer instructions Markdown → enum du schéma

Extraire depuis `instructions-template-nuextract.md` et placer dans `instructions.items.enum` :

- "- transformes le schéma JSON en template NuExtract"
- "- considères les énumérations JSON comme par exemple \"language\": {\"type\": \"string\",\"enum\": [\"de\", \"fr\", \"it\", \"en\"]} comme des énumérations dans le format de template NuExtract \"language\": [\"de\", \"fr\", \"it\", \"en\"]"

## Phase 3 : Adapter code (Vert)

### Créer fonction transformSchemaToConfig()

**Fichier** : `hermes2022-concepts-site-extraction/src/nuextract-client.js`

Fonction helper pour transformer schéma JSON Schema en objet config JSON :

- Parcourir récursivement `schema.properties`
- **Pour propriétés simples avec enum** : utiliser `property.enum[0]` comme valeur par défaut
- **Pour arrays avec items.enum** : utiliser `property.items.enum` (array complet) comme valeur par défaut
- Construire objet config avec valeurs extraites
- Retourner objet config JSON utilisable

**Logique clé** :

```javascript
// Pour propriété simple
if (property.enum && property.type !== 'array') {
  configValue = property.enum[0];
}

// Pour array
if (property.type === 'array' && property.items?.enum) {
  configValue = property.items.enum; // Array complet
}
```

### Modifier loadGlobalConfig()

Changements :

- Lire `/config/extraction-config.schema.json` au lieu de `/config/extraction-config.json`
- Parser schéma JSON Schema
- Appeler `transformSchemaToConfig(schema)` pour obtenir objet config
- **Valider l'objet config transformé avec Ajv** en utilisant le schéma `extraction-config.schema.json` (même principe que validation schéma JSON principal avec Ajv)
- Validation structurelle minimale (config objet, section nuextract présente)
- try-catch général avec `console.error()` contextualisé (Pattern 3)
- `console.log()` en entrée de fonction (bonnes pratiques)
- Retourner config transformé

### Modifier loadInstructions()

Changements :

- Extraire depuis `config.nuextract.templateTransformationInstructions.instructions` (array complet)
- Valider que c'est un array (lever erreur si type invalide)
- Joindre valeurs avec `\n` pour concaténation
- Lever erreur si absent : "templateTransformationInstructions.instructions non trouvé dans config.nuextract. Script stopped."
- try-catch général avec `console.error()` contextualisé (Pattern 3)
- `console.log()` en entrée et sortie de fonction (bonnes pratiques)
- SRP respecté : extraction uniquement depuis config en mémoire, pas de chargement fichier

### Vérifier generateTemplate()

Vérifier que `generateTemplate()` utilise correctement `loadInstructions(config)` avec nouvelle source (pas de changement nécessaire normalement).

## Phase 4 : Exécuter tests (Vert)

### Exécuter tests unitaires

Vérifier que tests unitaires d'erreur passent maintenant (principe BDD Vert).

### Exécuter tests d'intégration mockés

Vérifier que tests d'intégration mockés passent.

### Exécuter tests d'intégration réels

**Fichiers** :

- `__tests__/integration/with-external-system/template-generation.feature`
- `__tests__/integration/with-external-system/template-generation.steps.ts`

Adapter si nécessaire et vérifier que tests réels passent.

### Validation régression

Exécuter `npm test` complet et vérifier absence de régression.

## Phase 5 : Refactor (optionnel)

### Factoriser steps communes

Si applicable, mutualiser steps dans `__tests__/shared/` pour améliorer lisibilité.

### Améliorer code sans changer comportement

Refactoriser `transformSchemaToConfig()` si nécessaire pour clarté.

## Phase 6 : Nettoyage et documentation

### Supprimer fichier Markdown obsolète

**Fichier à supprimer** : `hermes2022-concepts-site-extraction/config/instructions-template-nuextract.md`

### Supprimer extraction-config.json du répertoire config

**Fichier à supprimer** : `hermes2022-concepts-site-extraction/config/extraction-config.json`

Raison : Le schéma JSON Schema (`extraction-config.schema.json`) est maintenant la source unique. Le fichier `extraction-config.json` sera créé uniquement lors de l'historisation dans le répertoire des données extraites (fonctionnalité à implémenter ultérieurement).

### Documenter nouveau pattern

**Fichier** : `hermes2022-to-archimate/hermes2022-concepts-site-extraction/.cursor/rules/specification-hermes2022-concepts-site-extraction.mdc`

Ajouter section "Décisions architecturales et techniques" :

- Pattern `templateTransformationInstructions` dans `extraction-config.schema.json` sous `nuextract`
- Transformation schéma → config avec `transformSchemaToConfig()`
- **Pattern enum uniquement** (pas de `default`) :
  - Propriétés simples : `enum[0]` = valeur par défaut
  - Arrays : `items.enum` (array complet) = valeur par défaut
- Validation avec schéma JSON Schema
- Historisation future dans répertoire des données extraites

## Critères de validation

### Phase 1 (Rouge)

- Tests unitaires d'erreur créés et échouent comme attendu
- Tests d'intégration adaptés et échouent comme attendu

### Phase 2

- Schéma `extraction-config.schema.json` créé avec structure complète
- Instructions migrées dans `items.enum` du schéma
- Pattern enum cohérent : `enum[0]` pour propriétés simples, `items.enum` complet pour arrays

### Phase 3 (Vert)

- Fonction `transformSchemaToConfig()` implémentée avec logique correcte (enum[0] vs items.enum)
- `loadGlobalConfig()` modifié pour lire schéma et transformer
- `loadInstructions()` modifié
- Code conforme aux règles de gouvernance

### Phase 4 (Vert)

- Tests unitaires d'erreur passent
- Tests d'intégration mockés passent
- Tests d'intégration réels passent
- Pas de régression fonctionnelle

### Phase 5 (Refactor)

- Code refactorisé si nécessaire
- Steps mutualisées si applicable

### Phase 6

- Fichier Markdown supprimé
- Fichier `extraction-config.json` supprimé du répertoire config
- Documentation mise à jour avec pattern complet et cohérent

## Fichiers impactés

**Création** :

- `hermes2022-concepts-site-extraction/config/extraction-config.schema.json`
- `__tests__/unit/nuextract-client-error-handling.feature`
- `__tests__/unit/nuextract-client-error-handling.steps.ts`

**Modification** :

- `hermes2022-concepts-site-extraction/src/nuextract-client.js`
- `__tests__/integration/with-external-system-mocked/template-generation-mocked.feature`
- `__tests__/integration/with-external-system-mocked/template-generation-mocked.steps.ts`
- `__tests__/integration/with-external-system/template-generation.feature`
- `__tests__/integration/with-external-system/template-generation.steps.ts`
- `hermes2022-to-archimate/hermes2022-concepts-site-extraction/.cursor/rules/specification-hermes2022-concepts-site-extraction.mdc`

**Suppression** :

- `hermes2022-concepts-site-extraction/config/instructions-template-nuextract.md`
- `hermes2022-concepts-site-extraction/config/extraction-config.json`

## Notes importantes

**Historisation** : La fonctionnalité de sauvegarde de `extraction-config.json` dans le répertoire des données extraites sera implémentée ultérieurement (hors scope de cette migration).

**Pattern enum crucial** :

- **Propriétés simples** : `enum[0]` = première valeur de l'enum
- **Arrays** : `items.enum` = array complet avec toutes les valeurs de l'enum
- Pas de `default` dans le schéma JSON Schema

**SRP strict** : `loadInstructions()` extrait uniquement depuis config en mémoire, pas de chargement fichier.