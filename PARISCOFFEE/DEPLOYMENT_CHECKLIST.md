# ✅ Checklist de Déploiement - PARISCOFFEE

## 🚀 État du Déploiement

### ✅ Configuration Vercel
- [ ] **Projet créé** : `pariscoffee`
- [ ] **Repository GitHub connecté**
- [ ] **Build automatique activé**
- [ ] **Variables d'environnement configurées**

### ✅ Variables d'Environnement
- [ ] **MONGODB_URI** : Configuration avec vos identifiants MongoDB
- [ ] **CLOUDINARY_CLOUD_NAME** : Votre cloud name Cloudinary
- [ ] **CLOUDINARY_API_KEY** : Votre API key
- [ ] **CLOUDINARY_API_SECRET** : Votre API secret
- [ ] **ADMIN_EMAIL** : Email administrateur
- [ ] **ADMIN_PASSWORD** : Mot de passe administrateur
- [ ] **NEXTAUTH_SECRET** : Secret généré
- [ ] **NEXTAUTH_URL** : `https://pariscoffee.vercel.app`

### ✅ MongoDB Atlas
- [ ] **Cluster créé**
- [ ] **Utilisateur créé** : `pariscoffee`
- [ ] **IP Whitelist** : 0.0.0.0/0 (ou IPs Vercel)
- [ ] **Base de données** : `pariscoffee_shop`

### ✅ Cloudinary
- [ ] **Compte créé**
- [ ] **Upload preset créé** : `boutique_preset`
- [ ] **Folder configuré** : `pariscoffee`

### ✅ Tests Post-Déploiement
- [ ] **API Health Check** : `https://pariscoffee.vercel.app/api/health`
- [ ] **Connexion Admin** : `https://pariscoffee.vercel.app/admin`
- [ ] **Upload d'image test**
- [ ] **Création d'un produit test**
- [ ] **Vérification boutique** : `https://pariscoffee.vercel.app`

## 📱 URLs de Production
- **Boutique** : `https://pariscoffee.vercel.app`
- **Admin** : `https://pariscoffee.vercel.app/admin`
- **API Health** : `https://pariscoffee.vercel.app/api/health`

## 🔐 Accès Admin
- **Email** : Configuré dans ADMIN_EMAIL
- **Password** : Configuré dans ADMIN_PASSWORD

## 📝 Notes
- Toutes les variables doivent être configurées avant le déploiement
- Redéployer après ajout/modification des variables
- Vérifier les logs Vercel en cas d'erreur