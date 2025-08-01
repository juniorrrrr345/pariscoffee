# 📦 PARISCOFFEE - Repository Complet

Ce repository contient deux projets distincts :

## 🛍️ 1. Boutique E-commerce (Racine du projet)
La boutique en ligne PARISCOFFEE construite avec Next.js
- **Déploiement** : Vercel
- **Dossiers principaux** :
  - `/src` - Code source de la boutique
  - `/public` - Assets publics
  - `/views` - Templates

## 🤖 2. Bot Telegram (`/telegram-bot`)
Bot Telegram pour gérer les commandes et interactions clients
- **Déploiement** : Render
- **Configuration** : Voir `/telegram-bot/README.md`

## 🚀 Configuration Rapide

### Pour la Boutique (Vercel)
1. Déployez sur Vercel depuis la racine
2. Ajoutez les variables d'environnement (voir `CONFIGURATION_VERCEL_PARISCOFFEE.md`)

### Pour le Bot Telegram (Render)
1. Allez dans `/telegram-bot`
2. Créez un fichier `.env` basé sur `.env.example`
3. Configurez :
   ```
   BOT_TOKEN=votre_token_bot
   ADMIN_ID=votre_id_telegram
   ```
4. Déployez sur Render (voir `/telegram-bot/DEPLOY_RENDER.md`)

## 📁 Structure du Repository

```
pariscoffee/
├── src/                    # Code source boutique
├── public/                 # Assets boutique
├── telegram-bot/          # Bot Telegram complet
│   ├── bot.js            # Fichier principal du bot
│   ├── config.js         # Configuration
│   ├── .env.example      # Variables d'environnement
│   └── DEPLOY_RENDER.md  # Guide de déploiement
├── package.json           # Boutique Next.js
└── README_STRUCTURE.md    # Ce fichier
```

## ⚠️ Important
- La boutique et le bot sont **indépendants**
- Chacun a ses propres dépendances et configuration
- Déployez-les sur des plateformes séparées (Vercel + Render)