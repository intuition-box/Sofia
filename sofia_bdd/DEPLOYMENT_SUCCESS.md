# Déploiement Local Réussi !

## Statut des Services

Les services suivants sont opérationnels :

### PostgreSQL
- **Status** : Healthy ✅
- **Port** : 5432
- **URL Locale** : `postgresql://eliza:eliza_secure_password_2025@localhost:5432/eliza_db`
- **Database** : `eliza_db`
- **User** : `eliza`

### PgAdmin
- **Status** : Running ✅
- **Port** : 8080
- **URL Locale** : http://localhost:8080
- **Email** : (configuré dans .env)
- **Password** : `pgadmin_secure_password_2025`

## Tables Créées

### Schéma `eliza`
1. **conversations** - Gestion des conversations
2. **messages** - Messages des conversations
3. **memories** - Base de connaissances
4. **users** - Utilisateurs et agents
5. **actions** - Log des actions/outils

### Schéma `logs`
1. **system_logs** - Logs système

## Données de Test

- **1 conversation** de test
- **2 messages** de test
- **2 utilisateurs** de test (eliza_agent, test_user)

## Commandes Utiles

### Gestion des conteneurs
```bash
# Démarrer les services
docker compose up -d

# Arrêter les services
docker compose down

# Voir les logs
docker compose logs -f

# Voir le statut
docker compose ps
```

### Connexion à la base
```bash
# Via psql dans le conteneur
docker exec -it eliza-postgres psql -U eliza -d eliza_db

# Tester la connexion
docker exec eliza-postgres pg_isready -U eliza -d eliza_db
```

### Backup
```bash
# Créer un backup
./scripts/backup.sh

# Restaurer un backup
./scripts/restore.sh backups/eliza_backup_YYYYMMDD_HHMMSS.sql.gz
```

## Configuration Eliza

Pour connecter Eliza à cette base de données, utilisez :

### Variable d'environnement
```bash
DATABASE_URL=postgresql://eliza:eliza_secure_password_2025@localhost:5432/eliza_db
```

### Configuration Node.js
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'eliza_db',
  user: 'eliza',
  password: 'eliza_secure_password_2025'
});

// Test de connexion
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err.stack : res.rows[0]);
});
```

### Exemple de requête
```javascript
// Récupérer toutes les conversations
const conversations = await pool.query(
  'SELECT * FROM eliza.conversations ORDER BY created_at DESC'
);

// Insérer un message
await pool.query(
  `INSERT INTO eliza.messages (conversation_id, role, content)
   VALUES ($1, $2, $3)`,
  [conversationId, 'user', 'Hello!']
);
```

## Prochaines Étapes

### Option 1 : Continuer en local
- Développer et tester votre application Eliza localement
- Les données persistent dans les volumes Docker

### Option 2 : Déployer sur Phala Cloud
1. Installer la CLI Phala Cloud
2. Créer un compte sur https://phala.network
3. Déployer avec :
   ```bash
   phala login
   phala create sofia-bdd
   phala deploy
   ```
4. Récupérer les endpoints HTTPS :
   - PostgreSQL : `https://<app-id>-5432.dstack-prod5.phala.network`
   - PgAdmin : `https://<app-id>-8080.dstack-prod5.phala.network`

## Accès PgAdmin

1. Ouvrez http://localhost:8080 dans votre navigateur
2. Connectez-vous avec l'email configuré dans `.env`
3. Ajoutez un nouveau serveur :
   - **Name** : Eliza DB
   - **Host** : postgres
   - **Port** : 5432
   - **Database** : eliza_db
   - **Username** : eliza
   - **Password** : eliza_secure_password_2025

## Sécurité

⚠️ **Important pour la production** :
1. Changez tous les mots de passe dans `.env`
2. N'exposez pas le port 5432 publiquement
3. Utilisez SSL/TLS pour les connexions distantes
4. Effectuez des backups réguliers

## Support

- Documentation PostgreSQL : https://www.postgresql.org/docs/
- Documentation Docker Compose : https://docs.docker.com/compose/
- Documentation Phala Cloud : https://docs.phala.com/

---

**Projet créé le** : 2025-11-13
**Image Docker** : `sofia_bdd-postgres:latest`
**Taille de l'image** : ~432 MB
