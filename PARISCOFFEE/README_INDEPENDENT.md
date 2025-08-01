# Configuration Indépendante - PARISCOFFEE

Ce guide explique comment configurer votre propre instance de la boutique PARISCOFFEE.

## 📋 Prérequis

### MongoDB Atlas
- Compte MongoDB Atlas gratuit
- Base de données : `pariscoffee_shop`
- Cluster : `pariscoffee.mongodb.net`
- Utilisateur : `pariscoffee`

### Cloudinary
- Compte Cloudinary gratuit
- Cloud name : À configurer
- API Key et Secret : À générer

### Vercel
- Compte Vercel gratuit
- Projet connecté à GitHub

## 🔧 Configuration MongoDB

1. **Créer un cluster MongoDB Atlas**
   - Aller sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Créer un cluster gratuit
   - Choisir la région la plus proche

2. **Créer un utilisateur**
   - Database Access > Add New Database User
   - Username : `pariscoffee`
   - Password : Générer un mot de passe sécurisé
   - Permissions : Read and write to any database

3. **Configurer l'accès réseau**
   - Network Access > Add IP Address
   - Allow Access from Anywhere (0.0.0.0/0)
   - Pour la production, limitez aux IPs Vercel

4. **Récupérer l'URI de connexion**
   - Connect > Connect your application
   - Copier l'URI et remplacer `<password>`

## 🖼️ Configuration Cloudinary

1. **Créer un compte Cloudinary**
   - [Cloudinary](https://cloudinary.com)
   - Plan gratuit suffisant

2. **Récupérer les credentials**
   - Dashboard > Account Details
   - Cloud Name, API Key, API Secret

3. **Créer un upload preset**
   - Settings > Upload > Upload presets
   - Nom : `boutique_preset`
   - Mode : Unsigned
   - Folder : `pariscoffee`

## 🚀 Variables d'environnement

Créez un fichier `.env.local` à la racine :

```env
# MongoDB
MONGODB_URI=mongodb+srv://pariscoffee:VOTRE_MOT_DE_PASSE@pariscoffee.mongodb.net/?retryWrites=true&w=majority&appName=PARISCOFFEE

# Cloudinary
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret

# NextAuth
NEXTAUTH_URL=https://pariscoffee.vercel.app
NEXTAUTH_SECRET=générer-avec-openssl-rand-base64-32

# Admin
ADMIN_EMAIL=admin@pariscoffee.com
ADMIN_PASSWORD=VotreMotDePasseAdmin123!
```

## 📦 Déploiement sur Vercel

1. **Fork le repository**
2. **Importer dans Vercel**
3. **Configurer les variables d'environnement**
4. **Déployer**

## 🔐 Accès Admin

- URL : `https://votre-domaine.vercel.app/admin`
- Email : Celui défini dans ADMIN_EMAIL
- Password : Celui défini dans ADMIN_PASSWORD

## ✅ Vérification

1. **Tester la connexion MongoDB**
   - `https://votre-domaine.vercel.app/api/health`

2. **Tester l'upload d'images**
   - Créer un produit avec image dans l'admin

3. **Vérifier la boutique**
   - Les produits doivent apparaître instantanément

## 🆘 Dépannage

### Erreur MongoDB
- Vérifier l'URI de connexion
- Vérifier les IP autorisées
- Vérifier les credentials

### Erreur Cloudinary
- Vérifier les API keys
- Vérifier l'upload preset

### Erreur Admin
- Vérifier ADMIN_EMAIL et ADMIN_PASSWORD
- Redéployer après modification des variables

## 📝 Notes

- Les variables d'environnement doivent être ajoutées dans Vercel
- Ne jamais commiter le fichier `.env.local`
- Utiliser des mots de passe forts et uniques
- Sauvegarder régulièrement votre base de données