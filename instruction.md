D'après la documentation, voici les détails importants sur ensureConnection et les problèmes courants liés à world-join et entityId not found :

ensureConnection - Détails
ensureConnection est la méthode recommandée en v1.x qui remplace les anciennes méthodes. Elle gère en une seule fois :

Création/vérification de l'entité (utilisateur)
Création/vérification de la room
Ajout du participant à la room
Connexion au world (serveur/environnement)
await runtime.ensureConnection({
  entityId: userId,
  roomId,
  userName,
  name,
  worldId,
  source,
});

Problèmes courants
1. entityId not found
Assurez-vous que l'entityId existe avant d'appeler ensureConnection
L'entité doit être créée ou vérifiée en premier
Vérifiez que l'ID est au bon format (UUID)
2. world-join errors
Le worldId doit correspondre à un world existant
Créez le world d'abord avec ensureWorldExists() si nécessaire
Vérifiez les permissions de connexion au world
3. Room ID mismatch
Le roomId doit correspondre exactement entre Socket.IO et la session
Même une différence d'un caractère empêche la réception des messages
Utilisez le même ID pour la session et Socket.IO
4. Ordre des opérations
L'ordre correct est crucial :

Créer la session via API REST
Connecter Socket.IO
Rejoindre la room (étape critique souvent oubliée)
Écouter messageBroadcast (pas message)


D'après la documentation, voici les définitions exactes et relations entre ces identifiants :

Définitions
entityId - Identifiant d'une entité (utilisateur, agent, ou objet). Représente "qui" dans le système.

roomId - Identifiant d'une conversation/canal. C'est le contexte où les messages sont échangés.

channelId - Synonyme de roomId dans certains contextes (rétrocompatibilité). Représente le même concept.

sessionId - Identifiant d'une session de conversation. Abstraction au-dessus de room/channel.

worldId - Identifiant d'un serveur/environnement (ex: serveur Discord). Contexte plus large que room.

authorId / senderId - Identifiant de l'expéditeur d'un message. Généralement un entityId.

Relations
worldId (serveur)
  └── roomId/channelId (conversation)
      └── entityId (participants)
          └── messages (authorId/senderId)

sessionId → roomId (1:1 mapping)



Définitions et Relations
authorId / senderId - Identifiant de l'expéditeur d'un message. C'est toujours un entityId (utilisateur ou agent).

entityId - Vous le créez ou il est généré lors de ensureConnection(). Représente un utilisateur ou agent.

roomId - Retourné par POST /api/messaging/sessions comme sessionId, ou créé manuellement. C'est l'espace de conversation.

sessionId - Retourné par POST /api/messaging/sessions. Équivaut au roomId pour cette session.

worldId - Vous le définissez (ex: ID serveur Discord). Contexte global optionnel.

channelId - Synonyme de roomId (rétrocompatibilité).

Où Trouver les Valeurs
entityId/userId: Vous les générez (UUID) ou utilisez l'ID de votre plateforme
agentId: Défini dans votre configuration agent
sessionId/roomId: Retourné par POST /api/messaging/sessions
worldId: Vous le définissez (ex: serveur Discord ID)
authorId/senderId: Utilisez l'entityId de l'expéditeur
Want to know more? These pages may help:

Create Session
Plugin Migration Guide
Messaging Infrastructure



cest id doivent etre identitique ? ? entityId/userId ; authorId/senderId ;sessionId/roomId:

Searched entityId userId authorId senderId sessionId roomId relationship
Oui, voici les clarifications :

Identifiants Identiques
entityId / userId - OUI, identiques dans la plupart des cas. entityId est le terme générique, userId est utilisé pour les utilisateurs spécifiquement.

authorId / senderId - OUI, identiques. Les deux représentent l'expéditeur du message (toujours un entityId).

sessionId / roomId - OUI, identiques quand vous utilisez Sessions API. Le sessionId retourné devient le roomId pour Socket.IO.

Où Trouver les Valeurs
entityId/userId : Vous les créez (UUID) ou utilisez l'ID de votre système
agentId : Dans votre fichier de configuration agent
sessionId : Retourné par POST /api/messaging/sessions
roomId : Utilisez le sessionId retourné
authorId/senderId : L'entityId de celui qui envoie
worldId : Vous le définissez (optionnel, ex: ID serveur Discord)


Voici un payload complet pour envoyer un message via Socket.IO :

socket.emit('message', {
  type: 2, // SEND_MESSAGE
  payload: {
    senderId: 'votre-entity-id',
    senderName: 'Nom Utilisateur',
    message: 'Votre message texte',
    roomId: 'votre-room-id',
    messageId: crypto.randomUUID(),
    source: 'web',
    attachments: [],
    metadata: {}
  }
});

Champs requis:

type: 2 - Type SEND_MESSAGE
senderId - Votre entityId
message - Le texte du message
roomId - ID de la room/session
messageId - UUID unique
Pour recevoir les réponses:

socket.on('messageBroadcast', (data) => {
  if (data.roomId === 'votre-room-id') {
    console.log('Réponse:', data.text);
  }
});


Vous avez :

userId (entityId) - L'ID de votre utilisateur
agentId (entityId) - L'ID de l'agent
Ce sont deux entityId séparés. Quand vous envoyez un message, le senderId est votre userId. Quand l'agent répond, le senderId est l'agentId.

Exemple concret :

// Votre utilisateur
const userId = "user-123"; // entityId de l'utilisateur

// L'agent
const agentId = "agent-456"; // entityId de l'agent

// Vous envoyez un message
senderId: userId // "user-123"

// L'agent répond
senderId: agentId // "agent-456"