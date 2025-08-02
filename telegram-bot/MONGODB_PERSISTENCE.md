# 💾 Persistance MongoDB pour le Bot Telegram

## 🔧 Configuration

Le bot utilise maintenant MongoDB pour sauvegarder toutes les données en temps réel. Plus de perte de données lors des redéploiements !

### 📊 Collections utilisées

Le bot crée automatiquement ces collections dans votre base de données :

1. **`botusers`** - Stocke les utilisateurs du bot
   - `userId` : ID Telegram de l'utilisateur
   - `username` : Nom d'utilisateur Telegram
   - `firstName` : Prénom
   - `lastName` : Nom
   - `isAdmin` : Si l'utilisateur est admin
   - `joinedAt` : Date d'inscription
   - `lastActive` : Dernière activité

2. **`botconfigs`** - Configuration du bot (pour future utilisation)
   - `key` : Clé de configuration
   - `value` : Valeur
   - `updatedAt` : Dernière mise à jour

3. **`botmessages`** - Historique des messages (pour future utilisation)
   - `messageId` : ID du message
   - `userId` : ID de l'utilisateur
   - `text` : Contenu
   - `type` : Type de message
   - `sentAt` : Date d'envoi

### ✅ Avantages

- **Persistance complète** : Les données survivent aux redéploiements
- **Temps réel** : Sauvegarde instantanée à chaque action
- **Synchronisation** : Possibilité de lier les données avec la boutique
- **Scalabilité** : Prêt pour des milliers d'utilisateurs

### 🚀 Déploiement

Aucune configuration supplémentaire nécessaire ! Le bot se connecte automatiquement à votre MongoDB existante.

### 📈 Visualisation des données

Vous pouvez voir vos données dans MongoDB Atlas :
1. Connectez-vous à [MongoDB Atlas](https://cloud.mongodb.com)
2. Sélectionnez votre cluster "Pariscoffee"
3. Cliquez sur "Browse Collections"
4. Vous verrez les nouvelles collections `botusers`, `botconfigs`, etc.

### 🔍 Requêtes utiles MongoDB

```javascript
// Voir tous les utilisateurs du bot
db.botusers.find()

// Voir tous les admins
db.botusers.find({ isAdmin: true })

// Compter les utilisateurs
db.botusers.countDocuments()

// Voir les utilisateurs actifs aujourd'hui
db.botusers.find({ 
  lastActive: { 
    $gte: new Date(new Date().setHours(0,0,0,0)) 
  } 
})
```

### 🛠️ Maintenance

Les anciennes données des fichiers JSON (`users.json`, `admins.json`) ne sont plus utilisées et peuvent être supprimées après vérification que tout fonctionne bien.