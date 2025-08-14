# 📋 Configuration Complète pour Render - Bot Telegram Webhook

## 🤖 **Bot Telegram : @ParisCoffeee_bot**

## 🚀 Configuration du Service sur Render

### 1️⃣ **Paramètres du Service**

Dans le dashboard Render, créez un nouveau **Web Service** avec ces paramètres :

| Paramètre | Valeur |
|-----------|--------|
| **Service Type** | `Web Service` (⚠️ PAS Background Worker) |
| **Name** | `telegram-bot-webhook` |
| **Region** | `Frankfurt (EU)` ou `Oregon (US)` |
| **Branch** | `main` |
| **Root Directory** | `telegram-bot` |
| **Runtime** | `Node` |
| **Instance Type** | `Free` |

### 2️⃣ **Commandes de Build et Start**

| Commande | Valeur |
|----------|--------|
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

### 3️⃣ **Variables d'Environnement**

Ajoutez ces variables dans la section **Environment** de Render :

```env
BOT_TOKEN=8128299360:AAEWmbRLjkTaQYP17GsiGm5vhQv8AcJLKIY
ADMIN_ID=7670522278
PORT=10000
MONGODB_URI=mongodb+srv://coffeelivraison4:FCiljtFGv5iKaKL3@pariscoffee.x0f0tsy.mongodb.net/test?retryWrites=true&w=majority&appName=Pariscoffee
WEBHOOK_URL=https://[VOTRE-SERVICE].onrender.com
NODE_ENV=production
```

⚠️ **IMPORTANT** : Remplacez `[VOTRE-SERVICE]` dans `WEBHOOK_URL` par l'URL réelle de votre service Render après le déploiement.

## 📝 Étapes de Déploiement

### Étape 1 : Préparer GitHub
```bash
# Assurez-vous d'être sur la branche main
git checkout main

# Poussez les derniers changements
git push origin main
```

### Étape 2 : Créer le Service sur Render

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **New +** → **Web Service**
3. Connectez votre repository GitHub (`juniorrrrr345/pariscoffee`)
4. Sélectionnez la branche `main`

### Étape 3 : Configurer le Service

Remplissez les champs suivants :

#### **General Settings**
- **Name**: `telegram-bot-webhook`
- **Region**: Choisissez la plus proche
- **Branch**: `main`
- **Root Directory**: `telegram-bot`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### **Environment Variables**
Cliquez sur **Advanced** et ajoutez toutes les variables une par une :

| Key | Value |
|-----|-------|
| `BOT_TOKEN` | `8128299360:AAEWmbRLjkTaQYP17GsiGm5vhQv8AcJLKIY` |
| `ADMIN_ID` | `7670522278` |
| `PORT` | `10000` |
| `MONGODB_URI` | `mongodb+srv://coffeelivraison4:FCiljtFGv5iKaKL3@pariscoffee.x0f0tsy.mongodb.net/test?retryWrites=true&w=majority&appName=Pariscoffee` |
| `WEBHOOK_URL` | `[À AJOUTER APRÈS LE DÉPLOIEMENT]` |
| `NODE_ENV` | `production` |

### Étape 4 : Déployer

1. Cliquez sur **Create Web Service**
2. Attendez que le déploiement se termine (5-10 minutes)
3. Une fois déployé, copiez l'URL du service (ex: `https://telegram-bot-webhook-xyz.onrender.com`)

### Étape 5 : Mettre à jour WEBHOOK_URL

1. Retournez dans **Environment** → **Environment Variables**
2. Modifiez `WEBHOOK_URL` avec l'URL copiée
3. Cliquez sur **Save Changes**
4. Le service redémarrera automatiquement

## ✅ Vérification du Déploiement

### Dans les Logs Render

Vous devriez voir :
```
==> Starting service with 'npm start'
> telegram-bot@1.0.0 start
> node bot-webhook.js

🌐 Serveur démarré sur le port 10000
✅ Bot connecté à MongoDB
✅ Ancien webhook supprimé
🔗 Webhook configuré: https://telegram-bot-webhook-xyz.onrender.com/bot8128299360:AAEWmbRLjkTaQYP17GsiGm5vhQv8AcJLKIY
ℹ️ Info webhook: {
  url: 'https://telegram-bot-webhook-xyz.onrender.com/bot8128299360:AAEWmbRLjkTaQYP17GsiGm5vhQv8AcJLKIY',
  has_custom_certificate: false,
  pending_update_count: 0
}
🤖 Bot démarré avec succès en mode webhook!
📱 Bot: @ParisCoffeee_bot
👤 Admin ID: 7670522278
```

### Test sur Telegram

1. Ouvrez Telegram
2. Cherchez `@ParisCoffeee_bot`
3. Envoyez `/start`
4. Le bot devrait répondre immédiatement

### Commandes Admin

Avec votre compte admin (ID: 7670522278), vous pouvez utiliser :
- `/admin` - Menu d'administration
- `/addadmin [ID]` - Ajouter un admin
- `/removeadmin [ID]` - Retirer un admin

## 🔧 Dépannage

| Problème | Solution |
|----------|----------|
| **Build failed** | Vérifiez que le Root Directory est bien `telegram-bot` |
| **Error 409 Conflict** | Arrêtez tous les bots locaux avant le déploiement |
| **Bot ne répond pas** | Vérifiez que `WEBHOOK_URL` correspond à l'URL du service |
| **MongoDB error** | Le bot utilisera automatiquement les fichiers JSON comme fallback |
| **Service sleeps** | Normal sur le plan gratuit, se réveille au premier message (~30s) |

## 📊 Monitoring

### Santé du Service
- URL de santé : `https://[votre-service].onrender.com/`
- Devrait retourner : `{"status":"ok","mode":"webhook","timestamp":"..."}`

### Logs en Temps Réel
- Dashboard Render → Votre Service → **Logs** → **Live tail**

### Métriques
- Dashboard Render → Votre Service → **Metrics**
- Surveillez : Memory, CPU, Response time

## 🎯 Checklist Finale

- [ ] Repository GitHub à jour sur `main`
- [ ] Service créé sur Render (Web Service)
- [ ] Root Directory : `telegram-bot`
- [ ] Build Command : `npm install`
- [ ] Start Command : `npm start`
- [ ] Toutes les variables d'environnement ajoutées
- [ ] `WEBHOOK_URL` mis à jour avec l'URL du service
- [ ] Logs montrent "Webhook configuré"
- [ ] Bot répond sur Telegram
- [ ] Menu admin accessible avec `/admin`

## 💡 Tips

1. **Plan Gratuit** : Le service s'endort après 15 min d'inactivité, premier message peut prendre 30s
2. **Persistance** : Les données sont sauvegardées dans MongoDB + fichiers JSON de backup
3. **Sécurité** : Ne partagez jamais votre BOT_TOKEN
4. **Updates** : Pour mettre à jour, faites juste `git push` sur `main`

## 🚀 C'est parti !

Votre bot est maintenant prêt à être déployé sur Render en mode webhook, sans erreur 409 ! 🎉