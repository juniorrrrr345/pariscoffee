# 📋 Guide de Configuration PARISCOFFEE

## 🔧 Ce qu'il faut configurer

### 1. MongoDB Atlas
Vous devez me fournir :
- **URI MongoDB** : L'URL de connexion à votre base de données MongoDB
- Format : `mongodb+srv://username:password@cluster.mongodb.net/...`

### 2. Cloudinary
Vous devez me fournir :
- **Cloud Name** : Le nom de votre compte Cloudinary
- **API Key** : Votre clé API Cloudinary
- **API Secret** : Votre clé secrète API Cloudinary

### 3. Informations Admin
Vous devez décider :
- **Email Admin** : L'email pour vous connecter au panel admin
- **Mot de passe Admin** : Un mot de passe sécurisé pour l'admin

## 📝 Où modifier ces informations

### Fichiers à mettre à jour avec vos informations :

1. **MongoDB** :
   - `src/lib/mongodb-runtime.ts` : Lignes 22 et 60
   - `src/lib/mongodb-fixed.ts` : Ligne 3
   - `src/lib/mongodb-config.ts` : Ligne 8

2. **Cloudinary** :
   - `src/lib/cloudinary.ts` : Lignes 5-7

3. **Variables d'environnement** (pour Vercel) :
   - Créez un fichier `.env.local` avec :
   ```env
   MONGODB_URI=votre_uri_mongodb
   CLOUDINARY_CLOUD_NAME=votre_cloud_name
   CLOUDINARY_API_KEY=votre_api_key
   CLOUDINARY_API_SECRET=votre_api_secret
   ADMIN_EMAIL=votre_email_admin
   ADMIN_PASSWORD=votre_mot_de_passe_admin
   NEXTAUTH_SECRET=générer_avec_openssl_rand_base64_32
   NEXTAUTH_URL=https://pariscoffee.vercel.app
   ```

## 🚀 Étapes de déploiement

1. **Fournissez-moi vos informations MongoDB et Cloudinary**
2. **Je mettrai à jour les fichiers avec vos informations**
3. **Créez un repository GitHub**
4. **Déployez sur Vercel**
5. **Configurez les variables d'environnement dans Vercel**

## ✅ Checklist

- [ ] URI MongoDB fourni
- [ ] Informations Cloudinary fournies
- [ ] Email et mot de passe admin choisis
- [ ] Repository GitHub créé
- [ ] Projet déployé sur Vercel
- [ ] Variables d'environnement configurées

## 📌 Notes importantes

- **Ne partagez jamais** vos clés API publiquement
- **Utilisez des mots de passe forts** pour l'admin
- **Sauvegardez** vos informations de connexion en lieu sûr
- **Testez** la connexion après configuration

---

Donnez-moi vos informations MongoDB et Cloudinary pour que je puisse finaliser la configuration !