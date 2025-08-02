# 🤖 Bot Telegram avec MongoDB (Optionnel)

## 📊 Configuration automatique

Le bot fonctionne maintenant de deux façons :

### 1️⃣ Avec MongoDB (Recommandé)
- ✅ Données sauvegardées en permanence
- ✅ Pas de perte lors des redéploiements
- ✅ Synchronisation en temps réel
- ✅ Prêt pour des milliers d'utilisateurs

### 2️⃣ Sans MongoDB (Fallback)
- 📁 Utilise des fichiers JSON locaux
- ⚠️ Données perdues lors des redéploiements
- ✅ Fonctionne sans configuration supplémentaire

## 🚀 Le bot détecte automatiquement

1. **Si MongoDB est disponible** → Il l'utilise
2. **Si MongoDB n'est pas disponible** → Il utilise les fichiers JSON

## 📈 Voir vos données dans MongoDB Atlas

1. Connectez-vous à [MongoDB Atlas](https://cloud.mongodb.com)
2. Sélectionnez votre cluster **"Pariscoffee"**
3. Cliquez sur **"Browse Collections"**
4. Allez dans la base de données **"test"**
5. Vous verrez la collection **"botusers"**

### Structure des données :
```json
{
  "userId": 123456789,
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "isAdmin": false,
  "joinedAt": "2025-01-30T10:00:00Z",
  "lastActive": "2025-01-30T15:30:00Z"
}
```

## ✅ C'est tout !

Le bot gère tout automatiquement. Vous n'avez rien à configurer !