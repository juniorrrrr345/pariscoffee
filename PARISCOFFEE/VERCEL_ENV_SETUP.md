# 🔧 Configuration des Variables d'Environnement Vercel - PARISCOFFEE

## 📋 Étapes Rapides

1. **Allez sur Vercel** : https://vercel.com/dashboard
2. **Cliquez sur votre projet** `pariscoffee`
3. **Settings → Environment Variables**

## 🔑 Variables à Ajouter

```env
MONGODB_URI=mongodb+srv://pariscoffee:VOTRE_MOT_DE_PASSE@pariscoffee.mongodb.net/?retryWrites=true&w=majority&appName=PARISCOFFEE
CLOUDINARY_CLOUD_NAME=VOTRE_CLOUD_NAME
CLOUDINARY_API_KEY=VOTRE_API_KEY
CLOUDINARY_API_SECRET=VOTRE_API_SECRET
ADMIN_EMAIL=admin@pariscoffee.com
ADMIN_PASSWORD=VotreMotDePasseAdmin123!
NEXTAUTH_SECRET=générer-avec-openssl-rand-base64-32
NEXTAUTH_URL=https://pariscoffee.vercel.app
```

## ✅ Vérification

1. **Redéployez** après avoir ajouté les variables
2. **Testez** :
   - https://pariscoffee.vercel.app/api/health
   - https://pariscoffee.vercel.app/admin

## 🆘 Aide

- **MongoDB** : Remplacez VOTRE_MOT_DE_PASSE par votre mot de passe MongoDB
- **Cloudinary** : Récupérez vos credentials depuis le dashboard Cloudinary
- **NEXTAUTH_SECRET** : Générez avec `openssl rand -base64 32`
- **Admin** : Utilisez un email et mot de passe sécurisés

## 📝 Important

- Ajoutez toutes les variables avant de déployer
- Les variables sont sensibles à la casse
- Ne partagez jamais ces informations