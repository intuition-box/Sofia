# Excalidraw Integration Setup

## ✅ Ce qui a été fait

1. **Installation du package Excalidraw**
   ```bash
   npm install @excalidraw/excalidraw
   ```

2. **Création du composant ExcalidrawViewer**
   - Fichier: `src/components/ExcalidrawViewer.tsx`
   - Utilise l'import dynamique pour éviter les problèmes SSR
   - Mode lecture seule activé

3. **Configuration Webpack**
   - Ajout d'un plugin custom dans `docusaurus.config.ts`
   - Résolution des modules ESM avec `fullySpecified: false`

4. **Intégration dans la documentation**
   - Fichier: `docs/architecture/overview.md`
   - Utilise `BrowserOnly` pour le rendu côté client uniquement

## 🔧 Pour tester

**IMPORTANT**: Vous devez redémarrer complètement le serveur de développement pour que les changements webpack prennent effet.

### 1. Arrêter le serveur actuel

```bash
# Trouver et arrêter le processus sur le port 3000
lsof -ti:3000 | xargs kill -9
```

### 2. Redémarrer le serveur

```bash
npm run start
```

### 3. Vérifier le diagramme

Naviguez vers: `http://localhost:3000/docs/architecture/overview`

Le diagramme Excalidraw devrait s'afficher de manière interactive !

## 📝 Utilisation

Pour ajouter un nouveau diagramme Excalidraw dans n'importe quelle page docs :

```mdx
import BrowserOnly from '@docusaurus/BrowserOnly';
import ExcalidrawViewer from '@site/src/components/ExcalidrawViewer';

<BrowserOnly fallback={<p>Loading diagram...</p>}>
  {() => <ExcalidrawViewer src="/excalidraw/votre-diagram.excalidraw.json" />}
</BrowserOnly>
```

## 🐛 Dépannage

Si vous voyez des erreurs liées à `roughjs/bin/rough` ou modules ESM :
1. Assurez-vous que le serveur a été complètement redémarré
2. Videz le cache : `rm -rf .docusaurus`
3. Relancez : `npm run start`

Si les erreurs persistent, il peut y avoir un conflit de version. Dans ce cas, vérifiez que vous utilisez la même version d'Excalidraw que dans le repo d'exemple : https://github.com/0xIntuition/intuition-docs
