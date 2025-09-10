Oui, **X (anciennement Twitter)** permet toujours de récupérer la liste des comptes qu’un utilisateur suit, mais uniquement via son **API officielle** et en respectant leurs règles :

---

### ✅ **Comment faire légalement**

1. **Créer une application sur [developer.twitter.com](https://developer.twitter.com)**

   * Crée un compte développeur et configure ton projet.
   * Obtiens tes clés API (Consumer Key/Secret et Bearer Token).

2. **Demander les bons niveaux d’accès**

   * Depuis fin 2023, X a changé ses paliers d’API :

     * **Free** : très limité (ne donne généralement pas accès aux endpoints avancés).
     * **Basic/Pro/Enterprise** : permettent l’accès aux relations de suivi.
   * Tu devras peut-être souscrire un abonnement **Basic** ou supérieur.

3. **Utiliser l’endpoint approprié (v2)**

   * Endpoint :

     ```
     GET https://api.x.com/2/users/:id/following
     ```
   * Tu dois d’abord obtenir l’ID utilisateur via :

     ```
     GET https://api.x.com/2/users/by/username/:username
     ```
   * Ensuite, utilise ce `user_id` pour récupérer ses follows.

4. **Respecter OAuth2 et les permissions**

   * Si tu veux que **l’utilisateur authentifié** récupère **ses** follows, fais-le passer par le flux OAuth2 avec le scope `tweet.read` et `users.read`, et utilise son access token.
   * Pour d’autres utilisateurs, cela dépend du niveau d’API et de la politique de X.

---

### ⚠️ **Points importants**

* L’accès aux follows est **soumis aux limites de taux** et aux conditions de X.
* Les données ne doivent pas être stockées ou redistribuées sans respecter leur politique développeur.
* L’API et ses tarifs changent régulièrement : vérifie la [page officielle des tarifs et limites](https://developer.twitter.com/en/pricing) avant de développer.

