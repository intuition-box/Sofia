# 🎉 Déploiement Phala Cloud Réussi !

## Informations de Déploiement

**CVM ID** : `15c2b798-cfd4-4a6b-b06f-640d0c139e4b`
**App ID** : `f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4`
**Nom** : `sofia-bdd`
**Status** : ✅ **RUNNING**
**Date** : 2025-11-13

**Configuration** :
- vCPU: 2
- RAM: 4GB
- Disk: 50GB
- KMS: phala-prod10
- Region: US-WEST-1

---

## 🌐 URLs d'Accès HTTPS

### PgAdmin (Interface Web)
```
https://f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-8080.dstack-prod5.phala.network
```

**Credentials** :
- Email : `admin@example.com`
- Password : `pgadmin_secure_password_2025`

### PostgreSQL (Connexion Directe)
**Host** : `f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-5432.dstack-prod5.phala.network`
**Port** : `5432`
**Database** : `eliza_db`
**User** : `eliza`
**Password** : `eliza_secure_password_2025`

**Chaîne de connexion complète** :
```
postgresql://eliza:eliza_secure_password_2025@f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-5432.dstack-prod5.phala.network:5432/eliza_db
```

---

## 📦 Image Docker Publiée

Votre image PostgreSQL personnalisée est disponible publiquement sur Docker Hub :

**Docker Hub** : https://hub.docker.com/r/passiverecord/eliza-postgres
**Image** : `passiverecord/eliza-postgres:latest`
**Taille** : 432MB

Pour utiliser cette image localement :
```bash
docker pull passiverecord/eliza-postgres:latest
```

---

## 🔧 Configuration pour Eliza

### Variable d'Environnement
```bash
DATABASE_URL=postgresql://eliza:eliza_secure_password_2025@f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-5432.dstack-prod5.phala.network:5432/eliza_db
```

### Node.js / TypeScript
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-5432.dstack-prod5.phala.network',
  port: 5432,
  database: 'eliza_db',
  user: 'eliza',
  password: 'eliza_secure_password_2025',
  ssl: {
    rejectUnauthorized: false // Phala Cloud utilise des certificats auto-signés
  }
});

// Test de connexion
async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW(), version()');
    console.log('✅ Connecté à Phala Cloud PostgreSQL');
    console.log('Heure serveur:', res.rows[0].now);
    console.log('Version:', res.rows[0].version);
  } catch (err) {
    console.error('❌ Erreur de connexion:', err);
  }
}

testConnection();
```

### Python (psycopg2)
```python
import psycopg2

try:
    conn = psycopg2.connect(
        host="f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-5432.dstack-prod5.phala.network",
        port=5432,
        database="eliza_db",
        user="eliza",
        password="eliza_secure_password_2025",
        sslmode="require"
    )

    cur = conn.cursor()
    cur.execute("SELECT version();")
    print("✅ Connecté à Phala Cloud PostgreSQL")
    print("Version:", cur.fetchone()[0])

except Exception as e:
    print("❌ Erreur:", e)
```

---

## 📊 Structure de la Base de Données

### Schéma `eliza`
- **conversations** - Gestion des conversations (id, user_id, context, metadata, status)
- **messages** - Messages des conversations (id, conversation_id, role, content, metadata)
- **memories** - Base de connaissances (id, user_id, memory_type, content, importance_score)
- **users** - Utilisateurs et agents (id, username, user_type, preferences)
- **actions** - Log des actions/outils (id, conversation_id, action_name, parameters, result)

### Schéma `logs`
- **system_logs** - Logs système (id, level, message, context)

---

## 🛠️ Gestion du CVM

### Dashboard Web
```
https://cloud.phala.network/dashboard/cvms/app_f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4
```

### Commandes CLI

**Voir le statut** :
```bash
phala cvms get 15c2b798-cfd4-4a6b-b06f-640d0c139e4b
```

**Arrêter le CVM** :
```bash
phala cvms stop app_f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4
```

**Démarrer le CVM** :
```bash
phala cvms start app_f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4
```

**Redémarrer le CVM** :
```bash
phala cvms restart app_f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4
```

**Mettre à jour** :
```bash
phala deploy -n sofia-bdd -c docker-compose.yml -e .env.phala --vcpu 2 --memory 4G --disk-size 50G --kms-id phala-prod10 --uuid 15c2b798-cfd4-4a6b-b06f-640d0c139e4b
```

**Supprimer le CVM** :
```bash
phala cvms delete app_f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4
```

---

## ✅ Tests de Connexion

### Test 1 : Accès PgAdmin
1. Ouvrez : https://f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-8080.dstack-prod5.phala.network
2. Connectez-vous avec `admin@example.com` / `pgadmin_secure_password_2025`
3. Ajoutez un serveur :
   - Name : `Eliza Phala DB`
   - Host : `postgres` (ou l'IP interne)
   - Port : `5432`
   - Database : `eliza_db`
   - Username : `eliza`
   - Password : `eliza_secure_password_2025`

### Test 2 : Connexion psql (si installé localement)
```bash
psql "postgresql://eliza:eliza_secure_password_2025@f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-5432.dstack-prod5.phala.network:5432/eliza_db"
```

Commandes de test :
```sql
-- Lister les tables
\dt eliza.*;

-- Vérifier les données
SELECT COUNT(*) FROM eliza.conversations;
SELECT COUNT(*) FROM eliza.messages;
SELECT COUNT(*) FROM eliza.users;

-- Voir la version
SELECT version();
```

---

## 🔐 Sécurité

### ⚠️ Important pour la Production

1. **Changez les mots de passe** :
   - Modifiez `.env.phala` avec des mots de passe forts
   - Redéployez avec la commande update

2. **Ne committez jamais** :
   - `.env`
   - `.env.phala`
   - Toute information sensible

3. **Backups réguliers** :
   ```bash
   # Backup distant
   pg_dump "postgresql://eliza:password@host:5432/eliza_db" > backup.sql
   ```

4. **Monitoring** :
   - Surveillez l'utilisation des ressources sur le dashboard
   - Configurez des alertes si nécessaire

---

## 📚 Fichiers du Projet

- [`Dockerfile`](Dockerfile) - Image PostgreSQL personnalisée
- [`docker-compose.yml`](docker-compose.yml) - Configuration des services
- [`.env.phala`](.env.phala) - Variables d'environnement Phala Cloud
- [`init-scripts/01-init-eliza-db.sql`](init-scripts/01-init-eliza-db.sql) - Schéma SQL
- [`init-scripts/02-sample-data.sql`](init-scripts/02-sample-data.sql) - Données de test

---

## 🎯 Résumé de ce qui a été fait

✅ Docker installé sur WSL2
✅ Image PostgreSQL personnalisée créée
✅ Image publiée sur Docker Hub : `passiverecord/eliza-postgres:latest`
✅ docker-compose.yml optimisé pour Phala Cloud
✅ Variables d'environnement configurées
✅ CVM déployé sur Phala Cloud
✅ Status : **RUNNING** 🚀
✅ Endpoints HTTPS automatiques fonctionnels

---

## 📖 Ressources

- **Dashboard Phala Cloud** : https://cloud.phala.network/dashboard
- **Documentation Phala** : https://docs.phala.com/phala-cloud
- **Docker Hub Image** : https://hub.docker.com/r/passiverecord/eliza-postgres
- **Support Phala** : https://discord.gg/phala-network

---

## 🚀 Prochaines Étapes

1. ✅ Testez l'accès à PgAdmin
2. ✅ Connectez votre application Eliza avec la DATABASE_URL
3. ⏳ Configurez des backups automatiques
4. ⏳ Ajustez les ressources selon vos besoins
5. ⏳ Mettez en place un monitoring

---

**Félicitations ! Votre base de données PostgreSQL pour Eliza est maintenant pleinement opérationnelle sur Phala Cloud avec HTTPS automatique ! 🎉**

**Date de déploiement final** : 2025-11-13 16:40 UTC
