# Cursor Workspace - Hermes2022-to-ArchiMate

## Vue d'ensemble

Ce workspace Cursor orchestre plusieurs projets indépendants liés à la transformation de la documentation HERMES 2022 vers des modèles ArchiMate.

## Structure du Workspace

### 📋 Projet Maître
- **Nom** : `cursor-ws-hermes2022-to-archimate`
- **Rôle** : Orchestration et coordination des sous-projets
- **Gestion Git** : Repository principal pour la configuration du workspace

### 🔧 hermes2022-to-archimate
- **Rôle** : Règles de transformation et scripts HERMES 2022 → ArchiMate
- **Gestion Git** : Repository indépendant
- **URL** : https://github.com/micwic/hermes2022-to-archimate.git

### 📚 projects-common
- **Rôle** : Composants et utilitaires partagés entre projets
- **Gestion Git** : Repository indépendant

## Configuration

Ce workspace utilise la fonctionnalité **Multi-Root** de Cursor pour gérer plusieurs projets Git indépendants dans un seul environnement de développement.

### Ouvrir le workspace
```bash
cursor cursor-ws-hermes2022-to-archimate.code-workspace
```

## Avantages de cette architecture

1. **Séparation des responsabilités** : Chaque projet a son propre cycle de vie Git
2. **Coordination centralisée** : Le projet maître orchestre l'ensemble
3. **Flexibilité** : Possibilité d'ajouter/supprimer des sous-projets facilement
4. **Traçabilité** : Chaque projet conserve son historique Git indépendant

## Gestion des repositories

Chaque sous-projet peut être cloné indépendamment :
```bash
git clone https://github.com/micwic/hermes2022-to-archimate.git
```

Le workspace Cursor se charge ensuite d'orchestrer l'affichage et la navigation entre les projets.
