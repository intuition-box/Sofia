# Configuration ESLint et Prettier - SOFIA Extension

## Vue d'ensemble

Ce projet utilise ESLint et Prettier pour maintenir une qualité de code élevée et un style de formatage cohérent, optimisé pour le développement avec l'IA.

## Configuration ESLint

### Règles AI-friendly implémentées

- **Variables non utilisées** : Utiliser le préfixe `_` pour les variables intentionnellement inutilisées
- **Types explicites** : Encourager l'utilisation de types TypeScript clairs
- **Organisation des imports** : Tri automatique pour une meilleure lisibilité
- **Longueur des fonctions** : Limite recommandée de 100 lignes par fonction
- **Profondeur d'imbrication** : Maximum 6 niveaux d'imbrication
- **Nombres magiques** : Désactivé en développement pour plus de flexibilité

### Règles spécifiques par type de fichier

#### Fichiers TypeScript/TSX (`src/**/*.{ts,tsx}`)
- Support complet des extensions Chrome (globals.webextensions)
- Règles React Hooks pour les composants
- Configuration React Refresh pour le développement

#### Fichiers JavaScript (`**/*.{js,mjs}`)
- Configuration basique avec support Node.js
- Règles d'imports et variables non utilisées

#### Fichiers de test (`**/*.test.{ts,tsx}`, `**/__tests__/**/*`, `**/cypress/**/*`)
- Règles assouplies pour les tests
- `any` autorisé pour les mocks
- Variables non utilisées permises
- Console.log autorisé

#### Fichiers de configuration (`**/*.config.{js,ts}`)
- Règles très permissives
- Support require() et imports dynamiques

## Configuration Prettier

### Règles de formatage
```json
{
  "semi": true,              // Point-virgules obligatoires
  "trailingComma": "es5",    // Virgules finales ES5
  "singleQuote": true,       // Guillemets simples
  "printWidth": 100,         // Largeur de ligne 100 caractères
  "tabWidth": 2,             // Indentation 2 espaces
  "arrowParens": "avoid"     // Parenthèses d'arrow functions minimales
}
```

### Overrides spécifiques
- **Markdown** : Largeur 80, proseWrap: always
- **JSON** : Largeur 80 pour lisibilité

## Scripts NPM disponibles

```bash
# Vérification et correction
npm run lint              # Vérifier les erreurs ESLint
npm run lint:fix          # Corriger automatiquement les erreurs ESLint
npm run format            # Formater avec Prettier
npm run format:check      # Vérifier le formatage Prettier
npm run type-check        # Vérifier les types TypeScript

# Scripts combinés
npm run code-quality      # TypeScript + ESLint + Prettier (check)
npm run code-quality:fix  # TypeScript + ESLint:fix + Prettier:format
```

## Intégration VSCode

La configuration `.vscode/settings.json` inclut :

- **Format on Save** : Formatage automatique à la sauvegarde
- **ESLint Fix on Save** : Correction automatique des erreurs ESLint
- **Prettier par défaut** : Pour tous les types de fichiers supportés
- **Auto Import** : Organisation automatique des imports TypeScript
- **Tailwind IntelliSense** : Support pour les classes utilitaires

## Workflow recommandé

1. **Développement** : Laisser VSCode formater automatiquement
2. **Avant commit** : Exécuter `npm run code-quality:fix`
3. **CI/CD** : Exécuter `npm run code-quality` pour validation

## Gestion des erreurs

### Variables non utilisées
```typescript
// ❌ Erreur
function myFunction(unused, used) { return used; }

// ✅ Correct
function myFunction(_unused, used) { return used; }
```

### Types any
```typescript
// ⚠️ Warning (acceptable en développement)
const data: any = fetchData();

// ✅ Préféré
const data: UserData = fetchData();
```

### Imports dupliqués
```typescript
// ❌ Erreur
import { Component } from 'react';
import { useState } from 'react';

// ✅ Correct
import { Component, useState } from 'react';
```

## Personnalisation

Pour ajuster les règles selon vos besoins :

1. Modifier `eslint.config.js` pour les règles ESLint
2. Modifier `.prettierrc.json` pour le formatage
3. Mettre à jour `.vscode/settings.json` pour l'intégration IDE

## Fichiers de configuration

- `eslint.config.js` - Configuration ESLint principale
- `.prettierrc.json` - Configuration Prettier
- `.prettierignore` - Fichiers exclus du formatage
- `.vscode/settings.json` - Intégration VSCode

## Avantages pour l'IA

Cette configuration améliore la lisibilité du code pour l'IA en :

- **Standardisant** le style de code
- **Organisant** les imports de manière prévisible
- **Limitant** la complexité des fonctions
- **Fournissant** des types explicites
- **Maintenant** une structure cohérente 