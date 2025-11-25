# Déploiement Phala Cloud - Succès ! 🎉

## Informations de Déploiement

**CVM ID** : `15c2b798-cfd4-4a6b-b06f-640d0c139e4b`
**Nom** : `sofia-bdd`
**App ID** : `f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4`
**Dashboard** : https://cloud.phala.network/dashboard/cvms/15c2b798-cfd4-4a6b-b06f-640d0c139e4b

**KMS ID** : `phala-prod10`
**vCPU** : 2
**Memory** : 4GB
**Disk** : 50GB

**Date de déploiement** : 2025-11-13

---

## 🌐 Endpoints HTTPS Automatiques

Vos services sont maintenant accessibles via HTTPS avec les URLs suivantes :

### PostgreSQL
```
https://f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-5432.dstack-prod5.phala.network:5432
```

**Chaîne de connexion complète** :
```bash
postgresql://eliza:eliza_secure_password_2025@f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-5432.dstack-prod5.phala.network:5432/eliza_db
```

### PgAdmin (Interface Web)
```
https://f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-8080.dstack-prod5.phala.network
```

**Credentials** :
- Email : `admin@example.com` (ou celui configuré dans .env)
- Password : `pgadmin_secure_password_2025`

---

## 📝 Configuration pour Eliza

### Variable d'environnement
```bash
DATABASE_URL=postgresql://eliza:eliza_secure_password_2025@f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-5432.dstack-prod5.phala.network:5432/eliza_db
```

### Configuration Node.js / TypeScript
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://eliza:eliza_secure_password_2025@f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-5432.dstack-prod5.phala.network:5432/eliza_db',
  ssl: {
    rejectUnauthorized: true
  }
});

// Test de connexion
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erreur de connexion:', err);
  } else {
    console.log('Connecté à Phala Cloud PostgreSQL:', res.rows[0]);
  }
});
```

### Configuration Python
```python
import psycopg2

conn = psycopg2.connect(
    host="f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-5432.dstack-prod5.phala.network",
    port=5432,
    database="eliza_db",
    user="eliza",
    password="eliza_secure_password_2025",
    sslmode="require"
)
```

---

## 🔧 Gestion du Déploiement

### Voir le statut
```bash
phala status
```

### Voir les CVMs
```bash
phala cvms list
```

### Voir les logs (via Dashboard)
https://cloud.phala.network/dashboard/cvms/15c2b798-cfd4-4a6b-b06f-640d0c139e4b

### Mettre à jour le déploiement
```bash
# Après avoir modifié votre code
phala deploy -n sofia-bdd -c docker-compose.yml --uuid 15c2b798-cfd4-4a6b-b06f-640d0c139e4b
```

### Supprimer le déploiement
```bash
phala cvms delete 15c2b798-cfd4-4a6b-b06f-640d0c139e4b
```

---

## ✅ Vérifications à Faire

### 1. Tester PgAdmin
1. Ouvrez https://f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-8080.dstack-prod5.phala.network
2. Connectez-vous avec vos credentials
3. Ajoutez un serveur :
   - **Name** : Eliza Phala DB
   - **Host** : postgres
   - **Port** : 5432
   - **Database** : eliza_db
   - **Username** : eliza
   - **Password** : eliza_secure_password_2025

### 2. Tester la connexion PostgreSQL
```bash
# Depuis votre machine locale (nécessite psql)
psql "postgresql://eliza:eliza_secure_password_2025@f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-5432.dstack-prod5.phala.network:5432/eliza_db?sslmode=require"

# Test simple
psql "postgresql://eliza:eliza_secure_password_2025@f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-5432.dstack-prod5.phala.network:5432/eliza_db?sslmode=require" -c "SELECT version();"
```

### 3. Vérifier les tables
```sql
-- Lister les tables
\dt eliza.*;

-- Compter les données
SELECT COUNT(*) FROM eliza.conversations;
SELECT COUNT(*) FROM eliza.messages;
SELECT COUNT(*) FROM eliza.users;
```

---

## 🔐 Sécurité

### ⚠️ IMPORTANT
Les credentials sont actuellement stockés dans `.env`. Pour la production :

1. **Changez tous les mots de passe** dans `.env` et redéployez
2. **Ne committez jamais** le fichier `.env` dans git
3. **Utilisez des secrets** pour les données sensibles
4. **Activez les backups** réguliers
5. **Limitez l'accès** aux URLs publiques si possible

### Backups
Pour sauvegarder votre base de données Phala :
```bash
# Via pg_dump distant
pg_dump "postgresql://eliza:eliza_secure_password_2025@f079b79f8d3ab1175e9fbe3cf3b5dacf8cf898b4-5432.dstack-prod5.phala.network:5432/eliza_db?sslmode=require" > backup_phala_$(date +%Y%m%d).sql
```

---

## 📊 Monitoring

### Dashboard Phala Cloud
Accédez au dashboard pour :
- Voir les métriques (CPU, RAM, Disk)
- Consulter les logs
- Gérer les paramètres
- Voir les coûts

**URL** : https://cloud.phala.network/dashboard/cvms/15c2b798-cfd4-4a6b-b06f-640d0c139e4b

### Commandes de diagnostic
```bash
# Statut général
phala status

# Liste des CVMs
phala cvms list

# Détails d'un CVM
phala cvms get 15c2b798-cfd4-4a6b-b06f-640d0c139e4b
```

---

## 📚 Ressources

- **Documentation Phala Cloud** : https://docs.phala.com/phala-cloud
- **Support** : https://discord.gg/phala-network
- **Dashboard** : https://cloud.phala.network/dashboard
- **Status Page** : https://status.phala.network

---

## 🎯 Prochaines Étapes

1. ✅ Déploiement réussi
2. ⏳ Tester la connexion depuis votre application Eliza
3. ⏳ Configurer les backups automatiques
4. ⏳ Monitorer les performances
5. ⏳ Optimiser selon vos besoins

---

**Félicitations ! Votre base de données PostgreSQL pour Eliza est maintenant opérationnelle sur Phala Cloud avec HTTPS automatique ! 🚀**
