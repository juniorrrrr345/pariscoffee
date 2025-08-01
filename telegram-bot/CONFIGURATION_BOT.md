# 🤖 Configuration du Bot Telegram PARISCOFFEE

## 📋 Variables à Configurer

Vous n'avez que **2 variables** à modifier :

### 1. `BOT_TOKEN`
- Obtenez-le depuis [@BotFather](https://t.me/botfather) sur Telegram
- Commande : `/newbot` ou utilisez un bot existant
- Format : `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### 2. `ADMIN_ID`
- Votre ID Telegram personnel
- Obtenez-le via [@userinfobot](https://t.me/userinfobot)
- Ou démarrez votre bot et tapez `/id`
- Format : `123456789`

## 🚀 Déploiement sur Render

1. **Créez un compte sur [Render](https://render.com)**

2. **Créez un nouveau Web Service**
   - Connectez votre GitHub
   - Sélectionnez le repository `pariscoffee`
   - **Root Directory** : `telegram-bot`
   - **Build Command** : `npm install`
   - **Start Command** : `node bot.js`

3. **Ajoutez les variables d'environnement**
   - `BOT_TOKEN` = Votre token
   - `ADMIN_ID` = Votre ID Telegram

4. **Déployez !**

## ✅ C'est tout !

Le bot est déjà entièrement configuré. Il vous suffit de :
1. Mettre votre `BOT_TOKEN`
2. Mettre votre `ADMIN_ID`
3. Déployer sur Render

Le bot fonctionnera immédiatement avec toutes ses fonctionnalités ! 🎉