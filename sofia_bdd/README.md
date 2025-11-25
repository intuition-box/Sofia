# Eliza PostgreSQL Database - Phala Cloud

Base de données PostgreSQL pour Eliza, déployable sur Phala Cloud avec endpoints HTTPS automatiques.

## Architecture

Ce projet fournit une base de données PostgreSQL complète pour stocker les données d'Eliza avec :

- Base de données PostgreSQL 16
- Schéma optimisé pour conversations, messages, mémoires et actions
- Interface PgAdmin pour la gestion
- Scripts de backup/restore automatisés
- Endpoints HTTPS sécurisés via Phala Cloud

## Structure du projet

```
sofia_bdd/
├── Dockerfile                  # Image PostgreSQL personnalisée
├── docker-compose.yml          # Configuration Phala Cloud
├── .env.example                # Variables d'environnement (template)
├── init-scripts/               # Scripts d'initialisation SQL
│   ├── 01-init-eliza-db.sql   # Schéma de la base de données
│   └── 02-sample-data.sql      # Données de test
├── scripts/                    # Scripts utilitaires
│   ├── backup.sh              # Script de backup
│   └── restore.sh             # Script de restauration
├── backups/                    # Répertoire des backups
└── README.md                   # Cette documentation
```

## Schéma de la base de données

### Tables principales

1. **conversations** - Gestion des conversations
   - id, user_id, context, metadata, status

2. **messages** - Messages des conversations
   - id, conversation_id, role, content, metadata

3. **memories** - Base de connaissances
   - id, user_id, memory_type, content, importance_score

4. **users** - Utilisateurs et agents
   - id, username, user_type, preferences

5. **actions** - Log des actions/outils
   - id, conversation_id, action_name, parameters, result

6. **system_logs** - Logs système
   - id, level, message, context

## Déploiement sur Phala Cloud

### Prérequis

1. Compte Phala Cloud
2. Docker installé localement (pour les tests)
3. CLI Phala Cloud installée

### Étapes de déploiement

#### 1. Configuration initiale

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos credentials sécurisés
nano .env
```

Définissez des mots de passe forts pour :
- `POSTGRES_PASSWORD`
- `PGADMIN_PASSWORD`

#### 2. Test en local (optionnel)

```bash
# Construire et lancer les conteneurs
docker-compose up -d

# Vérifier les logs
docker-compose logs -f postgres

# Tester la connexion
psql postgresql://eliza:your_password@localhost:5432/eliza_db
```

#### 3. Déploiement sur Phala Cloud

```bash
# Se connecter à Phala Cloud
phala login

# Créer un nouveau projet
phala create sofia-bdd

# Déployer
phala deploy
```

#### 4. Récupérer les endpoints HTTPS

Après le déploiement, Phala Cloud vous fournira automatiquement les URLs HTTPS :

- **PostgreSQL** : `https://<app-id>-5432.dstack-prod5.phala.network`
- **PgAdmin** : `https://<app-id>-8080.dstack-prod5.phala.network`

### Connexion depuis Eliza

Utilisez cette chaîne de connexion dans votre configuration Eliza :

```bash
DATABASE_URL=postgresql://eliza:your_password@<app-id>-5432.dstack-prod5.phala.network:5432/eliza_db
```

Ou en Node.js :

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://eliza:your_password@<app-id>-5432.dstack-prod5.phala.network:5432/eliza_db',
  ssl: {
    rejectUnauthorized: true
  }
});
```

## Utilisation de PgAdmin

1. Accédez à `https://<app-id>-8080.dstack-prod5.phala.network`
2. Connectez-vous avec les credentials définis dans `.env`
3. Ajoutez un nouveau serveur :
   - **Name** : Eliza DB
   - **Host** : postgres (ou l'URL Phala Cloud)
   - **Port** : 5432
   - **Database** : eliza_db
   - **Username** : eliza
   - **Password** : votre mot de passe

## Backup et Restauration

### Créer un backup

```bash
# Backup automatique (conserve 7 jours)
./scripts/backup.sh
```

### Restaurer un backup

```bash
# Lister les backups disponibles
ls -lh backups/

# Restaurer un backup spécifique
./scripts/restore.sh backups/eliza_backup_20250113_120000.sql.gz
```

## Sécurité

### Bonnes pratiques

1. Changez tous les mots de passe par défaut
2. Utilisez des mots de passe forts (16+ caractères)
3. Ne committez jamais le fichier `.env`
4. Activez SSL/TLS pour les connexions (automatique sur Phala Cloud)
5. Limitez l'accès aux IPs de confiance si possible
6. Effectuez des backups réguliers

### Variables sensibles

Ne partagez jamais publiquement :
- `POSTGRES_PASSWORD`
- `PGADMIN_PASSWORD`
- Les URLs complètes avec credentials

## Monitoring

### Vérifier la santé de la base

```bash
# Via Docker
docker exec eliza-postgres pg_isready -U eliza -d eliza_db

# Via psql
psql -U eliza -d eliza_db -c "SELECT version();"
```

### Statistiques

```sql
-- Nombre de conversations
SELECT COUNT(*) FROM eliza.conversations;

-- Nombre de messages
SELECT COUNT(*) FROM eliza.messages;

-- Mémoires par type
SELECT memory_type, COUNT(*)
FROM eliza.memories
GROUP BY memory_type;

-- Taille de la base
SELECT pg_size_pretty(pg_database_size('eliza_db'));
```

## Optimisation

### Index

Le schéma inclut des index optimisés pour :
- Recherche par user_id
- Tri chronologique
- Recherche full-text avec pg_trgm
- Requêtes JSON avec GIN

### Performance

Configuration optimisée dans le Dockerfile :
- `shared_buffers = 256MB`
- `effective_cache_size = 1GB`
- `work_mem = 16MB`
- `maintenance_work_mem = 64MB`

## Maintenance

### Vacuum et Analyse

```sql
-- Vacuum complet
VACUUM FULL ANALYZE;

-- Vacuum d'une table spécifique
VACUUM ANALYZE eliza.messages;
```

### Nettoyage des anciennes données

```sql
-- Archiver les conversations de plus de 30 jours
UPDATE eliza.conversations
SET status = 'archived'
WHERE created_at < NOW() - INTERVAL '30 days'
AND status = 'active';

-- Supprimer les logs de plus de 7 jours
DELETE FROM logs.system_logs
WHERE created_at < NOW() - INTERVAL '7 days';
```

## Troubleshooting

### Problème de connexion

1. Vérifiez que le conteneur est en cours d'exécution
2. Vérifiez les credentials dans `.env`
3. Testez avec `pg_isready`
4. Consultez les logs : `docker-compose logs postgres`

### Problème de performance

1. Vérifiez les index avec `EXPLAIN ANALYZE`
2. Augmentez `shared_buffers` si nécessaire
3. Exécutez `VACUUM ANALYZE` régulièrement
4. Surveillez l'utilisation disque

### Espace disque insuffisant

1. Exécutez un backup
2. Nettoyez les anciennes données
3. Exécutez `VACUUM FULL`
4. Augmentez le volume sur Phala Cloud

## Support et Documentation

- [Documentation Phala Cloud](https://docs.phala.com/phala-cloud)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PgAdmin Documentation](https://www.pgadmin.org/docs/)

## Licence

Ce projet est fourni tel quel pour être utilisé avec Eliza.

## Auteur

Projet créé pour le déploiement d'Eliza sur Phala Cloud avec PostgreSQL.
