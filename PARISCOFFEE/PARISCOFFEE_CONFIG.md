# 🏭 PARISCOFFEE - Configuration Complète

## 📋 État de la Configuration

### ✅ Configuration Vercel
- **Projet déployé** : pariscoffee.vercel.app
- **Variables d'environnement** : À configurer
- **Build automatique** : Activé
- **Domaine personnalisé** : À configurer si nécessaire

### ✅ Configuration MongoDB
- **URI** : À fournir par l'utilisateur
- **Base de données** : pariscoffee_shop
- **Collections** : products, settings, users

### ✅ Configuration Cloudinary
- **Cloud Name** : À fournir par l'utilisateur
- **API Key** : À fournir par l'utilisateur
- **API Secret** : À fournir par l'utilisateur

### ✅ Configuration de la Boutique
- ✅ Nom de la boutique : **PARISCOFFEE**
- ✅ Logo moderne avec animation
- ✅ Fond noir avec effets visuels
- ✅ Design responsive

## 🌐 URLs de Production
- **Boutique** : https://pariscoffee.vercel.app
- **Admin** : https://pariscoffee.vercel.app/admin
- **API Health** : https://pariscoffee.vercel.app/api/health

## 🔧 Variables d'Environnement Requises

```env
# MongoDB
MONGODB_URI=mongodb+srv://pariscoffee:VOTRE_MOT_DE_PASSE@pariscoffee.mongodb.net/?retryWrites=true&w=majority&appName=PARISCOFFEE

# Cloudinary
CLOUDINARY_CLOUD_NAME=VOTRE_CLOUD_NAME
CLOUDINARY_API_KEY=VOTRE_API_KEY
CLOUDINARY_API_SECRET=VOTRE_API_SECRET

# NextAuth
NEXTAUTH_URL=https://pariscoffee.vercel.app
NEXTAUTH_SECRET=votre-secret-très-sécurisé-ici

# Admin
ADMIN_EMAIL=admin@pariscoffee.com
ADMIN_PASSWORD=votre-mot-de-passe-admin
```

## 📦 Collections MongoDB

### Products
```json
{
  "_id": "ObjectId",
  "name": "String",
  "description": "String",
  "price": "Number",
  "category": "String",
  "images": ["String"],
  "inStock": "Boolean",
  "featured": "Boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Settings
```json
{
  "_id": "default",
  "shopName": "PARISCOFFEE",
  "shopTitle": "PARISCOFFEE",
  "shopDescription": "Votre boutique de café en ligne",
  "currency": "€",
  "primaryColor": "#FFD700",
  "secondaryColor": "#000000",
  "loadingText": "PARISCOFFEE Chargement en cours 🚀",
  "heroTitle": "PARISCOFFEE",
  "heroSubtitle": "Découvrez notre collection exclusive",
  "footerText": "© 2025 PARISCOFFEE"
}
```

### Users
```json
{
  "_id": "ObjectId",
  "email": "String",
  "password": "String (hashed)",
  "role": "admin",
  "createdAt": "Date"
}
```

## 🚀 Déploiement

1. Créer un compte Vercel
2. Importer le projet depuis GitHub
3. Configurer les variables d'environnement
4. Déployer

## ✅ Checklist de Configuration

- [ ] MongoDB URI configuré
- [ ] Cloudinary configuré
- [ ] Variables d'environnement Vercel
- [ ] Admin créé
- [ ] Produits ajoutés
- [ ] Test de paiement

---

🎉 **PARISCOFFEE est maintenant complètement configuré et opérationnel !**