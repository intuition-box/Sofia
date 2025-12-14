# 🧹 WSL2 Disk Optimization (Sans déplacer la distro)

## 🎯 Objectif
- ✅ **Conserver Ubuntu WSL sur le disque C:**
- ✅ **Libérer de l’espace disque sur le NVMe**
- ✅ **Déplacer uniquement ce qui consomme beaucoup** (projets, caches, dépendances)
- ✅ **Aucun risque pour la distro WSL**

---

## 1️⃣ Identifier ce qui prend de la place

Dans WSL (Ubuntu) :

```bash
du -h --max-depth=1 ~ | sort -h
```

Pour aller plus loin :

```bash
du -h --max-depth=2 ~ | sort -h
```

🔍 Points critiques habituels :
- `node_modules`
- `.cache`
- `.npm`, `.pnpm-store`, `.yarn`
- `.docker`
- Projets React / builds

---

## 2️⃣ Accéder au SSD Windows depuis WSL

Si ton SSD est `D:` sous Windows :

```bash
cd /mnt/d
```

Créer une arborescence dédiée au dev :

```bash
mkdir -p /mnt/d/dev/{projects,cache,packages}
```

---

## 3️⃣ Déplacer les projets (méthode recommandée)

### Exemple avec un projet React

```bash
mv ~/projects/my-app /mnt/d/dev/projects/
ln -s /mnt/d/dev/projects/my-app ~/projects/my-app
```

✅ VS Code fonctionne normalement  
✅ Le disque C: est immédiatement soulagé

---

## 4️⃣ Déplacer les caches Node.js (gros gain)

### npm
```bash
mkdir -p /mnt/d/dev/cache/npm
npm config set cache /mnt/d/dev/cache/npm
```

### pnpm (très volumineux)
```bash
mkdir -p /mnt/d/dev/cache/pnpm
pnpm config set store-dir /mnt/d/dev/cache/pnpm
```

### yarn
```bash
mkdir -p /mnt/d/dev/cache/yarn
yarn config set cache-folder /mnt/d/dev/cache/yarn
```

---

## 5️⃣ Déplacer le cache global `~/.cache`

```bash
mv ~/.cache /mnt/d/dev/cache/.cache
ln -s /mnt/d/dev/cache/.cache ~/.cache
```

⚠️ Méthode sûre, utilisée couramment en environnement dev

---

## 6️⃣ Docker (si utilisé)

### Méthode simple et propre

1. Ouvrir **Docker Desktop**
2. `Settings → Resources → Disk Image Location`
3. Choisir un chemin sur le SSD (ex: `D:`)
4. Appliquer puis redémarrer WSL :

```powershell
wsl --shutdown
```

---

## 7️⃣ Nettoyage complémentaire

```bash
sudo apt clean
sudo apt autoremove -y
rm -rf /tmp/*
```

---

## 8️⃣ Vérifier l’espace disque

```bash
df -h
```

---

## ✅ Résumé rapide

| Action | Gain disque | Risque |
|------|------------|--------|
| Déplacer projets | ⭐⭐⭐⭐ | Aucun |
| Déplacer caches Node | ⭐⭐⭐⭐⭐ | Aucun |
| Déplacer `~/.cache` | ⭐⭐⭐⭐ | Très faible |
| Docker sur SSD | ⭐⭐⭐⭐⭐ | Aucun |
| Nettoyage apt | ⭐⭐ | Aucun |
---

## 🧠 Setup recommandé

```
Ubuntu (WSL)      → C:
Projets React     → D:
node_modules      → D:
Caches (npm/pnpm) → D:
Docker images     → D:
```

---

## 📌 Notes
- Cette approche est **100% compatible VS Code**
- Aucun impact sur WSL, Ubuntu ou tes outils
- Idéal pour projets **React / Vite / Node.js**

---

🛠️ Document prêt à être versionné ou partagé (`.md`)

