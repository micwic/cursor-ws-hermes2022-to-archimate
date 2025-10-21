<!-- a64467a2-4f11-4680-978b-19e8c27f9052 1c90ed7b-94a1-485f-a663-21698d6c79d0 -->
# Plan : Approche modulaire pour extraction NuExtract

## Contexte

Le schéma JSON `hermes2022-concepts.json` (4442 caractères) cause un timeout de 60s avec l'API `/api/infer-template-async`, retournant `status: "timeout"` et `outputData: null`.

Solution : Fusionner d'abord toutes les `$ref` du schéma, puis extraire modulairement chaque propriété ayant une propriété enfant `sourceUrl`, générer un template NuExtract par module.

## Workflow général

1. `loadAndResolveSchemas()` → Schéma fusionné (toutes `$ref` inline)
2. `extractModularSchemaProperties(schemaFusionné)` → Liste des modules avec `sourceUrl`
3. Pour chaque module : générer template NuExtract
4. Sauvegarder templates individuels + index global

## Modules détectés dans le schéma fusionné

**Important** : L'analyse porte sur le schéma APRÈS fusion des `$ref`. Le contenu de `hermes2022-phases.json` sera inline dans `concepts.concept-phases`.

### Modules identifiés

1. **`method`**

   - sourceUrl : `["/"]`
   - Propriétés : `hermesVersion`, `publicationDate`, `overview`

2. **`concepts` (niveau overview)**

   - sourceUrl : `["/project-management/method-overview.html", "/project-management/method-overview/preface.html"]`
   - Propriété : `overview`

3. **`concepts.concept-phases` (niveau overview phases)**

   - sourceUrl : `["/project-management/phases.html"]`
   - Propriété : `overview` (résumé conceptuel des phases)
   - Source : Vient de `hermes2022-phases.json` fusionné inline

4. **`concepts.concept-phases.phases` (tableau des phases)**

   - sourceUrl : 6 URLs enum (initiation, concept, deployment, implementation, execution, closure)
   - Structure : Tableau avec détails de chaque phase
   - Note : Chaque item du tableau a aussi sa propre `sourceUrl` individuelle

**Ignorées** :

- `config` : Pas de sourceUrl, valeurs gérées par le script
- Conteneurs sans sourceUrl propre

## Modifications à apporter

### 1. Nouvelle fonction `extractModularSchemaProperties(schema)`

**Fichier** : `hermes2022-concepts-site-extraction/src/nuextract-client.js`

**Fonction** : Parcourir récursivement le schéma FUSIONNÉ pour identifier les propriétés avec `sourceUrl` enfant

```javascript
function extractModularSchemaProperties(schema, path = '') {
  const modules = [];
  
  if (schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Vérifier si cette propriété a une sourceUrl enfant
      if (value.properties && value.properties.sourceUrl) {
        modules.push({
          path: currentPath,
          schema: value,
          sourceUrls: value.properties.sourceUrl.enum || [value.properties.sourceUrl.default]
        });
      }
      
      // Récursion pour sous-propriétés
      // Note : Pas besoin de vérifier !value.$ref car schéma déjà fusionné
      if (value.properties) {
        modules.push(...extractModularSchemaProperties(value, currentPath));
      }
      
      // Gérer les arrays (ex: phases)
      if (value.type === 'array' && value.items && value.items.properties) {
        modules.push(...extractModularSchemaProperties(value.items, `${currentPath}[]`));
      }
    }
  }
  
  return modules;
}
```

### 2. Nouvelle fonction `generateModularTemplates()`

**Fichier** : `hermes2022-concepts-site-extraction/src/nuextract-client.js`

**Fonction** : Pour chaque module identifié, générer un template NuExtract

```javascript
async function generateModularTemplates() {
  // 1. Charger et fusionner le schéma (toutes $ref inline)
  const fusedSchema = loadAndResolveSchemas();
  
  // 2. Extraire les modules avec sourceUrl
  const modules = extractModularSchemaProperties(fusedSchema);
  
  console.log(`=== Modules détectés : ${modules.length} ===`);
  modules.forEach(m => console.log(`  - ${m.path} (${m.sourceUrls.length} URL(s))`));
  
  const templates = {};
  
  for (const module of modules) {
    console.log(`\n[${module.path}] Traitement...`);
    console.log(`  URLs: ${module.sourceUrls.join(', ')}`);
    
    // 1. Charger instructions markdown existantes
    const instructions = loadInstructions();
    
    // 2. Construire description pour ce module spécifique
    const description = [
      instructions,
      `\n## Module: ${module.path}\n`,
      `## Schéma JSON à respecter\n`,
      JSON.stringify(module.schema, null, 2)
    ].join('\n');
    
    // 3. Générer template via API async
    console.log(`  Lancement job async (timeout 180s)...`);
    const asyncResponse = await inferTemplateFromDescriptionAsync(API_KEY, description, 180);
    const jobId = asyncResponse.jobId;
    
    console.log(`  Job ID: ${jobId}`);
    
    // 4. Polling
    const templateData = await pollJobUntilComplete(API_KEY, jobId, 20, 3000);
    
    // 5. Parser et sauvegarder
    const template = typeof templateData === 'string' ? JSON.parse(templateData) : templateData;
    
    const templateDir = resolveFromRepoRoot('shared/hermes2022-extraction-files/config/nuextract-template-generated');
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
    }
    
    const templatePath = path.join(templateDir, `${module.path.replace(/\./g, '-').replace(/\[\]/g, '-array')}-template.json`);
    
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2), 'utf8');
    console.log(`  ✓ Template sauvegardé: ${path.basename(templatePath)}`);
    
    templates[module.path] = {
      template,
      sourceUrls: module.sourceUrls,
      templatePath
    };
  }
  
  return templates;
}
```

### 3. Modifier `generateTemplate()` pour utiliser l'approche modulaire

**Fichier** : `hermes2022-concepts-site-extraction/src/nuextract-client.js`

**Changement** : Remplacer l'appel unique par l'approche modulaire

```javascript
async function generateTemplate() {
  try {
    console.log('=== Génération modulaire des templates ===\n');
    
    const templates = await generateModularTemplates();
    
    console.log(`\n=== Résumé ===`);
    console.log(`✓ ${Object.keys(templates).length} templates générés`);
    
    // Sauvegarder l'index des templates
    const templateDir = resolveFromRepoRoot('shared/hermes2022-extraction-files/config/nuextract-template-generated');
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
    }
    
    const indexPath = path.join(templateDir, 'templates-index.json');
    fs.writeFileSync(indexPath, JSON.stringify(templates, null, 2), 'utf8');
    console.log(`✓ Index sauvegardé: templates-index.json`);
    
    // Pour compatibilité avec tests, retourner le premier template
    return Object.values(templates)[0]?.template || null;
    
  } catch (error) {
    console.error(`Erreur génération modulaire: ${error.message}`);
    throw new Error('Template generation failed. Script stopped.');
  }
}
```

### 4. Augmenter le timeout à 180s

**Fichier** : `hermes2022-concepts-site-extraction/src/nuextract-client.js`

**Ligne** : 89

**Changement** :

```javascript
// Avant
async function inferTemplateFromDescriptionAsync(apiKey, description, timeout = 60)

// Après  
async function inferTemplateFromDescriptionAsync(apiKey, description, timeout = 180)
```

**Justification** : Timeout plus généreux pour modules individuels, évite échecs

### 5. Mettre à jour la spécification

**Fichier** : `hermes2022-concepts-site-extraction/.cursor/rules/specification-hermes2022-concepts-site-extraction.mdc`

**Section** : Après "Patterns validés pour l'utilisation de l'API asynchrone"

**Ajout** :

```markdown
#### Approche modulaire pour schémas complexes

- [2025-10-20] Pour les schémas JSON complexes (>2000 caractères), utilisation d'une approche modulaire
- [2025-10-20] Fusion préalable de toutes les `$ref` du schéma via `resolveJSONSchemaRefs()`
- [2025-10-20] Itération récursive sur le schéma fusionné pour détecter propriétés avec `sourceUrl` enfant
- [2025-10-20] Génération d'un template NuExtract par module détecté (ex: `method`, `concepts.overview`, `concepts.concept-phases`)
- [2025-10-20] Les modules issus de `$ref` fusionnées sont détectés automatiquement (ex: contenu de `hermes2022-phases.json` inline)
- [2025-10-20] Sauvegarde individuelle : `{module-path}-template.json`
- [2025-10-20] Index global : `templates-index.json` pour traçabilité
- [2025-10-20] Timeout 180s par module pour sécurité
```

### 6. Documenter dans le résumé de session

**Fichier** : `hermes2022-concepts-site-extraction/.cursor/rules/summary/2025-10-20-api-async-nuextract.md`

**Section** : Nouvelle section avant "Recommandations"

```markdown
## Évolution : Approche modulaire sur schéma fusionné

### Problème identifié avec schéma global

- Schéma `hermes2022-concepts.json` (4442 caractères) : Timeout 60s sans résultat
- Vérification API réelle : `outputData: null` avec `status: "timeout"`
- Conclusion : Schéma trop complexe pour génération template en une passe

### Solution : Extraction modulaire sur schéma fusionné

**Principe** :
1. Fusionner toutes les `$ref` du schéma (via `resolveJSONSchemaRefs`)
2. Itérer récursivement sur le schéma fusionné
3. Détecter propriétés ayant `sourceUrl` enfant
4. Générer un template par module

**Modules détectés dans schéma fusionné** :
1. `method` : hermesVersion, publicationDate, overview (sourceUrl: "/")
2. `concepts` (overview) : overview (sourceUrl: 2 URLs)
3. `concepts.concept-phases` (overview) : overview phases (sourceUrl: phases.html)
4. `concepts.concept-phases.phases` : tableau phases (sourceUrl: 6 URLs)

**Avantages** :
- Schémas plus petits, traitement plus rapide
- Timeout 180s par module au lieu de 60s global
- Détection automatique des modules dans `$ref` fusionnées
- Meilleure traçabilité et maintenabilité
- Réutilisabilité pour autres schémas complexes

**Workflow par module** :
1. Extraire sous-schéma JSON fusionné
2. Récupérer sourceUrls (enum)
3. Générer template NuExtract (timeout 180s)
4. Sauvegarder template individuel
5. Index global pour traçabilité
```

## Tests

Les tests BDD existants restent compatibles car `generateTemplate()` retourne toujours un template (le premier de la liste modulaire).

## Exécution recommandée

1. Appliquer toutes les modifications code
2. Exécuter le script avec `NUEXTRACT_API_KEY` défini
3. Observer les modules détectés dans le schéma fusionné
4. Vérifier la création des templates individuels dans `shared/hermes2022-extraction-files/config/nuextract-template-generated/`
5. Vérifier `templates-index.json` pour traçabilité

## Extensibilité future

Cette approche permet de traiter automatiquement :

- Tout schéma avec `$ref` multiples
- Toute nouvelle structure ajoutée au schéma global
- `hermes2022-scenarios.json`, `hermes2022-modules.json`, etc.
- Détection automatique des modules dans les références fusionnées

### To-dos

- [ ] Ajouter décision architecturale API async dans specification-hermes2022-concepts-site-extraction.mdc
- [ ] Implémenter inferTemplateFromDescriptionAsync, getJobStatus, pollJobUntilComplete
- [ ] Modifier generateTemplate pour utiliser API async avec sauvegarde du template
- [ ] Vérifier compatibilité des tests BDD sans modifier le périmètre
- [ ] Créer summary/2025-10-20-api-async-nuextract.md avec constats et décision
- [ ] Supprimer les 6 fichiers de tests temporaires