# Design System Migration Guide

Ce guide explique comment migrer tous les composants vers le nouveau système de design unifié basé sur SignalsTab et EchoesTab.

## 🎯 Objectif

Unifier tous les styles CSS de l'application en utilisant :
1. **CoreComponents.css** - Composants principaux basés sur SignalsTab/EchoesTab
2. **Global.css** enrichi avec des classes utilitaires
3. **Modal.css** - Système modal unifié

## 📋 Plan de Migration

### 1. Remplacer les imports CSS

**AVANT:**
```tsx
import '../../styles/AtomCreationModal.css'
import '../../styles/SpecificComponent.css'
```

**APRÈS:**
```tsx
import '../../styles/CoreComponents.css'
import '../../styles/Global.css'
```

### 2. Utiliser les classes communes au lieu de styles inline

**AVANT:**
```tsx
<div style={{
  background: 'rgba(76, 175, 80, 0.1)',
  border: '1px solid rgba(0, 0, 0, 0.3)',
  padding: '4px 10px',
  // ... plus de styles
}}>
```

**APRÈS:**
```tsx
<div className="upvote-badge">
```

## 🧱 Composants Principaux à Utiliser

### Cards & Containers
- `.triples-container` - Container principal
- `.echo-card` - Carte principale
- `.border-green` / `.border-blue` - Variantes de bordure
- `.triplet-item` - Item de triplet

### Text & Content
- `.triplet-text` - Texte principal avec `.subject`, `.action`, `.object`
- `.triplet-detail-section` - Section de détails expandable
- `.triplet-detail-title`, `.triplet-detail-name` - Titres et noms

### Actions & Buttons
- `.portal-button` - Boutons Portal
- `.upvote-badge` - Badges d'upvote
- `.batch-btn` avec `.add-to-signals`, `.delete-selected`
- Classes génériques de Global.css : `.btn`, `.btn.primary`, etc.

### Selection System
- `.selection-panel` - Panel de sélection
- `.echo-checkbox`, `.select-all-checkbox` - Checkboxes
- `.batch-actions` - Actions en lot

### States
- `.empty-state` avec `.empty-subtext`
- `.processing-message`
- `.refresh-button`

## 📁 Files à Migrer

### Priority 1 - Core Components
- [ ] BookmarkStyles.css → Migrer vers classes communes
- [ ] BottomNavigation.css → Utiliser classes Global.css
- [ ] AtomCreationModal.css → Migrer vers Modal.css

### Priority 2 - Page Components
- [ ] HomePage.css → Utiliser CoreComponents + Global
- [ ] ProfilePage.css → Utiliser CoreComponents + Global
- [ ] SearchResultPage.css → Utiliser CoreComponents + Global
- [ ] ChatPage.css → Utiliser CoreComponents + Global

### Priority 3 - Specific Components
- [ ] TrustCircleTab.css
- [ ] AccountTab.css
- [ ] SettingsPage.css
- [ ] LevelProgress.css

## 🔄 Processus de Migration

### Étape 1: Analyser le fichier CSS
1. Identifier les styles répétitifs
2. Mapper vers les classes communes existantes
3. Identifier les nouveautés à ajouter aux fichiers communs

### Étape 2: Remplacer les classes
1. Mettre à jour les imports
2. Remplacer les classes spécifiques par les communes
3. Supprimer les styles inline

### Étape 3: Nettoyer
1. Supprimer le fichier CSS spécifique
2. Tester le composant
3. Ajuster si nécessaire

## 🎨 Classes Utilitaires Disponibles

### Spacing
```css
.m-0, .m-xs, .m-sm, .m-md, .m-lg, .m-xl
.mt-*, .mb-*, .p-*, .pt-*, .pb-*
```

### Layout
```css
.flex, .flex-col, .items-center, .justify-between
.gap-xs, .gap-sm, .gap-md, .gap-lg
.w-full, .h-full, .flex-1
```

### Text
```css
.text-center, .text-left, .text-right
.text-primary, .text-muted, .text-error
.font-sm, .font-base, .font-lg, .font-bold
```

### Buttons & Forms
```css
.btn, .btn.primary, .btn.secondary, .btn.success
.input, .textarea, .select
.form-group, .form-actions
```

## ⚠️ Points d'Attention

1. **Variables CSS** : Toujours utiliser les variables de Global.css
2. **Responsive** : Tester sur mobile après migration
3. **Dark Theme** : Le système est basé sur un thème sombre
4. **Transitions** : Les animations sont intégrées dans les classes

## 🧪 Test Checklist

Après chaque migration :
- [ ] Le composant s'affiche correctement
- [ ] Les interactions fonctionnent (hover, click)
- [ ] Responsive design intact
- [ ] Cohérence visuelle avec SignalsTab/EchoesTab
- [ ] Performance (pas de styles redondants)

## 📚 Ressources

- `Global.css` - Variables et utilitaires
- `CoreComponents.css` - Composants principaux
- `Modal.css` - Système modal
- `SignalsTab.tsx` / `EchoesTab.tsx` - Références de design